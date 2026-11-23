import type Stripe from "stripe";
import { pool } from "../../config/db.js";
import { stripe } from "../../config/stripe.js";

type Outcome =
  | { kind: "paid" }
  | { kind: "ignored" }
  | { kind: "out_of_stock"; orderId: string };

type OrderRow = {
  id: string;
  user_id: string | null;
  status: string;
  discount_code_id: string | null;
};

type OrderItemRow = { variant_id: string | null; quantity: number };

// Stripe may send the same event more than once, so everything here must be safe to repeat.
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  // Only act on money that has actually arrived.
  if (session.payment_status !== "paid") return;

  const outcome = await markOrderPaid(session.id);

  if (outcome.kind === "out_of_stock") {
    await cancelAndRefund(session, outcome.orderId);
  }
}

async function markOrderPaid(stripeSessionId: string): Promise<Outcome> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // FOR UPDATE locks the order row, so two deliveries of the same event can't run together.
    const orderResult = await client.query<OrderRow>(
      `SELECT id, user_id, status, discount_code_id
       FROM orders WHERE stripe_session_id = $1 FOR UPDATE`,
      [stripeSessionId],
    );
    const order = orderResult.rows[0];

    if (!order) {
      await client.query("ROLLBACK");
      console.warn(`Stripe session ${stripeSessionId} has no matching order`);
      return { kind: "ignored" };
    }

    // Already paid (a repeated event) or cancelled: nothing to do.
    if (order.status !== "pending") {
      await client.query("ROLLBACK");
      return { kind: "ignored" };
    }

    const itemsResult = await client.query<OrderItemRow>(
      "SELECT variant_id, quantity FROM order_items WHERE order_id = $1 ORDER BY variant_id",
      [order.id],
    );

    // Reduce stock. The WHERE stock >= qty makes the update fail instead of going
    // negative, so two customers can't both get the last bag. Items are processed in
    // a fixed order so two webhooks can't deadlock on each other.
    for (const item of itemsResult.rows) {
      const updated = item.variant_id
        ? await client.query(
            `UPDATE product_variants SET stock = stock - $1
             WHERE id = $2 AND stock >= $1`,
            [item.quantity, item.variant_id],
          )
        : null;

      if (!updated || updated.rowCount === 0) {
        // Undo any stock already reduced for earlier items of this order.
        await client.query("ROLLBACK");
        return { kind: "out_of_stock", orderId: order.id };
      }
    }

    // Count the discount use. If the code ran out between the preview and the payment,
    // the customer still gets the price they were shown, and the counter just isn't raised.
    if (order.discount_code_id) {
      await client.query(
        `UPDATE discount_codes SET times_used = times_used + 1
         WHERE id = $1 AND (usage_limit IS NULL OR times_used < usage_limit)`,
        [order.discount_code_id],
      );
    }

    await client.query(
      "UPDATE orders SET status = 'paid', paid_at = now() WHERE id = $1",
      [order.id],
    );

    // Only now, after payment, empty the customer's cart.
    if (order.user_id) {
      await client.query(
        `DELETE FROM cart_items
         WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)`,
        [order.user_id],
      );
    }

    await client.query("COMMIT");
    return { kind: "paid" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// The customer paid for something we can no longer ship: give the money back.
async function cancelAndRefund(session: Stripe.Checkout.Session, orderId: string): Promise<void> {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    // Throwing makes Stripe retry the webhook later.
    throw new Error(`Cannot refund order ${orderId}: the session has no payment intent`);
  }

  // The idempotency key means a retry can't refund the same order twice.
  await stripe.refunds.create(
    { payment_intent: paymentIntentId, metadata: { orderId, reason: "out_of_stock" } },
    { idempotencyKey: `refund-order-${orderId}` },
  );

  await pool.query(
    "UPDATE orders SET status = 'cancelled' WHERE id = $1 AND status = 'pending'",
    [orderId],
  );

  console.warn(`Order ${orderId} was out of stock after payment: cancelled and refunded`);
}