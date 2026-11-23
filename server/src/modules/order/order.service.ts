import { env } from "../../config/env.js";
import { pool } from "../../config/db.js";
import { stripe } from "../../config/stripe.js";
import { AppError } from "../../utils/error.js";
import { getCart } from "../cart/cart.service.js";
import { calculateTotals, findValidDiscount } from "../pricing/pricing.service.js";
import type { CheckoutInput } from "./order.schema.js";

// Stripe rejects card payments below 0.50 USD.
const MIN_CHARGE_CENTS = 50;

type CartItem = Awaited<ReturnType<typeof getCart>>["items"][number];

function variantLabel(item: Pick<CartItem, "sizeGrams" | "grind">): string {
  return `${item.sizeGrams}g, ${item.grind}`;
}

// Creates the order and its items in one transaction. Each item copies the name,
// label and price as they are right now, so old orders stay correct if the product changes.
async function insertPendingOrder(params: {
  userId: string;
  items: CartItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  discountCodeId: string | null;
  shipping: CheckoutInput["shipping"];
}): Promise<string> {
  const { userId, items, shipping } = params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO orders (
         user_id, subtotal_cents, discount_cents, total_cents, discount_code_id,
         shipping_name, shipping_phone, shipping_street, shipping_city,
         shipping_state, shipping_zip, shipping_country
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        userId,
        params.subtotalCents,
        params.discountCents,
        params.totalCents,
        params.discountCodeId,
        shipping.name,
        shipping.phone,
        shipping.street,
        shipping.city,
        shipping.state || null,
        shipping.zip || null,
        shipping.country,
      ],
    );
    const orderId = rows[0]!.id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items
           (order_id, variant_id, product_name, variant_label, unit_price_cents, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.variantId, item.productName, variantLabel(item), item.unitPriceCents, item.quantity],
      );
    }

    await client.query("COMMIT");
    return orderId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function createCheckout(
  user: { id: string; email: string },
  input: CheckoutInput,
) {
  // 1. The cart always comes from the database, never from the client.
  const cart = await getCart({ userId: user.id });

  if (cart.items.length === 0) {
    throw new AppError("Your cart is empty", 400);
  }

  const unavailable = cart.items.filter((i) => !i.available);
  if (unavailable.length > 0) {
    const names = unavailable.map((i) => `${i.productName} (${variantLabel(i)})`).join(", ");
    throw new AppError(`Some items are no longer available in this quantity: ${names}`, 409);
  }

  // 2. Prices. The discount code is checked again here, because it may have
  //    expired or been used up since the customer previewed it in the cart.
  const discount = input.discountCode ? await findValidDiscount(input.discountCode) : null;
  const totals = calculateTotals(cart.subtotalCents, discount);

  if (totals.totalCents < MIN_CHARGE_CENTS) {
    throw new AppError("The order total is below the minimum payment amount", 400);
  }

  // 3. Save the order as "pending". Stock is NOT reduced and the cart is NOT cleared
  //    until Stripe confirms the payment (see the webhook).
  const orderId = await insertPendingOrder({
    userId: user.id,
    items: cart.items,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    totalCents: totals.totalCents,
    discountCodeId: discount?.id ?? null,
    shipping: input.shipping,
  });

  // 4. Create the Stripe Checkout Session.
  try {
    // A one-time coupon with our computed amount, so Stripe's total matches ours exactly.
    const coupon =
      discount && totals.discountCents > 0
        ? await stripe.coupons.create({
            amount_off: totals.discountCents,
            currency: "usd",
            duration: "once",
            name: discount.code.slice(0, 40),
          })
        : null;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: orderId,
      metadata: { orderId },
      line_items: cart.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.unitPriceCents,
          product_data: { name: `${item.productName} (${variantLabel(item)})` },
        },
      })),
      discounts: coupon ? [{ coupon: coupon.id }] : undefined,
      success_url: `${env.CLIENT_URL}/checkout/success?order=${orderId}`,
      cancel_url: `${env.CLIENT_URL}/cart`,
    });

    if (!session.url) {
      throw new Error("Stripe returned no checkout URL");
    }

    await pool.query("UPDATE orders SET stripe_session_id = $1 WHERE id = $2", [
      session.id,
      orderId,
    ]);

    return { orderId, checkoutUrl: session.url };
  } catch (err) {
    // Don't leave a pending order behind for a payment that never started.
    console.error("Failed to create Stripe checkout session:", err);
    await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [orderId]);
    throw new AppError("Could not start the payment. Please try again.", 502);
  }
}