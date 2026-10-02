import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { findValidDiscount, priceOrder } from "./pricing.service.js";
import { createCheckoutSession } from "./stripe.service.js";

const MIN_CHARGE_CENTS = 50; // Stripe cannot charge less than about 0.50 in USD

const CHECKOUT_ITEMS_SQL = `
  SELECT ci.variant_id::int AS "variantId", p.name AS "productName", v.label AS "variantLabel",
         v.price_cents AS "unitPriceCents", ci.quantity, v.stock,
         (v.is_active AND p.is_active) AS "available"
  FROM carts c
  JOIN cart_items ci      ON ci.cart_id = c.id
  JOIN product_variants v ON v.id = ci.variant_id
  JOIN products p         ON p.id = v.product_id
  WHERE c.user_id = $1
  ORDER BY ci.id
`;

// Part 1: check everything and save a PENDING order (all inside one transaction)
async function createPendingOrder(user, shipping, discountCode) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Read the cart again, with current prices and stock from the database
    const { rows: items } = await client.query(CHECKOUT_ITEMS_SQL, [user.id]);
    if (items.length === 0) throw new ApiError(400, "Your cart is empty");

    for (const i of items) {
      const name = `${i.productName} (${i.variantLabel})`;
      if (!i.available)
        throw new ApiError(409, `${name} is no longer available`);
      if (i.quantity > i.stock) {
        throw new ApiError(
          409,
          `Not enough stock for ${name} (only ${i.stock} available)`,
        );
      }
    }

    // 2. Work out the money with the same functions as /discounts/validate
    const subtotalCents = items.reduce(
      (n, i) => n + i.unitPriceCents * i.quantity,
      0,
    );
    const discount = discountCode
      ? await findValidDiscount(discountCode, subtotalCents, client)
      : null;
    const { discountCents, totalCents } = priceOrder(subtotalCents, discount);

    if (totalCents < MIN_CHARGE_CENTS) {
      throw new ApiError(400, "The order total is too small to pay online");
    }

    // 3. Save the order and a snapshot of every item
    const {
      rows: [order],
    } = await client.query(
      `INSERT INTO orders (user_id, subtotal_cents, discount_cents, total_cents, discount_code_id,
                           shipping_name, shipping_phone, shipping_address, shipping_city, shipping_country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id::int AS id`,
      [
        user.id,
        subtotalCents,
        discountCents,
        totalCents,
        discount?.id ?? null,
        shipping.name,
        shipping.phone ?? null,
        shipping.address,
        shipping.city,
        shipping.country,
      ],
    );

    for (const i of items) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, product_name, variant_label, unit_price_cents, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id,
          i.variantId,
          i.productName,
          i.variantLabel,
          i.unitPriceCents,
          i.quantity,
        ],
      );
    }

    await client.query("COMMIT");
    return { orderId: order.id, items, discountCents };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Part 2: ask Stripe for the payment page
export async function checkout(user, shipping, discountCode) {
  const { orderId, items, discountCents } = await createPendingOrder(
    user,
    shipping,
    discountCode,
  );

  try {
    const session = await createCheckoutSession({
      orderId,
      items,
      discountCents,
      customerEmail: user.email,
    });
    await pool.query("UPDATE orders SET stripe_session_id = $2 WHERE id = $1", [
      orderId,
      session.id,
    ]);
    return { orderId, checkoutUrl: session.url };
  } catch (err) {
    // Stripe failed: do not leave a pending order that can never be paid
    console.error("Stripe error:", err.message);
    await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [
      orderId,
    ]);
    throw new ApiError(502, "Payment service is unavailable, please try again");
  }
}



// ---------- Called by the Stripe webhook ----------

// Stripe says the customer paid. Safe to run more than once for the same order.
export async function markOrderPaid(session) {
  const orderId = Number(session.metadata?.orderId);
  if (!orderId) return; // not one of our orders

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock the order. If it is not pending any more, we already handled it.
    const { rows: [order] } = await client.query(
      'SELECT user_id, status, discount_code_id FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );
    if (!order || order.status !== 'pending') {
      if (order?.status === 'cancelled') {
        console.warn(`Order ${orderId} was cancelled but Stripe says it was paid. Check it manually.`);
      }
      await client.query('ROLLBACK');
      return;
    }

    // 2. Mark it paid
    await client.query(
      `UPDATE orders SET status = 'paid', paid_at = now(), stripe_payment_intent = $2 WHERE id = $1`,
      [orderId, session.payment_intent ?? null]
    );

    // 3. Reduce the stock. The guard (stock >= quantity) stops it from going negative.
    const { rows: items } = await client.query(
      'SELECT variant_id, quantity, product_name, variant_label FROM order_items WHERE order_id = $1',
      [orderId]
    );
    for (const i of items) {
      const { rowCount } = await client.query(
        'UPDATE product_variants SET stock = stock - $2 WHERE id = $1 AND stock >= $2',
        [i.variant_id, i.quantity]
      );
      if (rowCount === 0) {
        console.warn(`Order ${orderId}: not enough stock left for ${i.product_name} (${i.variant_label}). The customer has paid, so refund or restock manually.`);
      }
    }

    // 4. The discount code has now really been used
    if (order.discount_code_id) {
      await client.query('UPDATE discount_codes SET times_used = times_used + 1 WHERE id = $1', [order.discount_code_id]);
    }

    // 5. Remove the bought items from the customer's cart
    await client.query(
      `DELETE FROM cart_items
       WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)
         AND variant_id IN (SELECT variant_id FROM order_items WHERE order_id = $2)`,
      [order.user_id, orderId]
    );

    await client.query('COMMIT');
    // Later: send the confirmation email here (after the commit)
  } catch (err) {
    await client.query('ROLLBACK');
    throw err; // the webhook answers 500, so Stripe will try again later
  } finally {
    client.release();
  }
}

// The payment page expired without a payment
export async function cancelOrder(session) {
  const orderId = Number(session.metadata?.orderId);
  if (!orderId) return;
  await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1 AND status = 'pending'", [orderId]);
}