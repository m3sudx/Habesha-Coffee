import pool from '../config/db.js';
import ApiError from '../utils/ApiError.js';

// Pure function: no database, easy to test.
// percent -> value is a percentage (10 = 10%). fixed -> value is in cents.
export function calculateDiscount(discount, subtotalCents) {
  if (discount.type === 'percent') {
    return Math.floor((subtotalCents * discount.value) / 100);
  }
  return Math.min(discount.value, subtotalCents); // a fixed discount can never exceed the subtotal
}

// total = subtotal - discount
export function priceOrder(subtotalCents, discount = null) {
  const discountCents = discount ? calculateDiscount(discount, subtotalCents) : 0;
  return { subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}

// Finds a code and checks that it can be used for this subtotal.
// "db" can be the pool or a transaction client, so checkout can reuse this later.
export async function findValidDiscount(code, subtotalCents, db = pool) {
  const { rows: [d] } = await db.query(
    `SELECT code, type, value, min_order_cents AS "minOrderCents",
            is_active AS "isActive", usage_limit AS "usageLimit", times_used AS "timesUsed",
            (expires_at IS NOT NULL AND expires_at <= now()) AS expired
     FROM discount_codes
     WHERE upper(code) = upper($1)`,
    [code]
  );

  if (!d) throw new ApiError(400, 'Invalid discount code');
  if (!d.isActive) throw new ApiError(400, 'This discount code is no longer available');
  if (d.expired) throw new ApiError(400, 'This discount code has expired');
  if (d.usageLimit !== null && d.timesUsed >= d.usageLimit) {
    throw new ApiError(400, 'This discount code has reached its usage limit');
  }
  if (subtotalCents < d.minOrderCents) {
    throw new ApiError(400, `Minimum order of $${(d.minOrderCents / 100).toFixed(2)} required for this code`);
  }

  return { code: d.code, type: d.type, value: d.value };
}