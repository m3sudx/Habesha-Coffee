import pool from '../config/db.js';
import ApiError from '../utils/ApiError.js';

// Which status can an order move to from each status?
// (Cancelling a PAID order is not allowed yet: it would also need a refund and a restock.)
const TRANSITIONS = {
  pending: ['cancelled'],
  paid: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export async function adminListOrders({ status, search, page, limit }) {
  const { rows } = await pool.query(
    `SELECT o.id::int AS id, u.name AS "customerName", u.email AS "customerEmail",
            o.status, o.total_cents AS "totalCents", o.created_at AS "createdAt",
            COUNT(*) OVER()::int AS total
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE ($1::text IS NULL OR o.status = $1::order_status)
       AND ($2::text IS NULL OR o.id::text = $2 OR u.email ILIKE '%' || $2 || '%')
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT $3 OFFSET ($4 - 1) * $3`,
    [status, search, limit, page]
  );
  const total = rows[0]?.total ?? 0;
  return {
    data: rows.map(({ total, ...order }) => order),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Same as the customer's order detail, but for ANY order, plus the customer
export async function adminGetOrder(orderId) {
  const { rows: [order] } = await pool.query(
    `SELECT o.id::int AS id, o.status,
            o.subtotal_cents AS "subtotalCents", o.discount_cents AS "discountCents", o.total_cents AS "totalCents",
            dc.code AS "discountCode", o.paid_at AS "paidAt", o.created_at AS "createdAt",
            json_build_object('id', u.id::int, 'name', u.name, 'email', u.email) AS customer,
            json_build_object(
              'name', o.shipping_name, 'phone', o.shipping_phone, 'address', o.shipping_address,
              'city', o.shipping_city, 'country', o.shipping_country
            ) AS shipping,
            COALESCE((
              SELECT json_agg(json_build_object(
                       'productName', oi.product_name, 'variantLabel', oi.variant_label,
                       'unitPriceCents', oi.unit_price_cents, 'quantity', oi.quantity
                     ) ORDER BY oi.id)
              FROM order_items oi WHERE oi.order_id = o.id
            ), '[]'::json) AS items
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN discount_codes dc ON dc.id = o.discount_code_id
     WHERE o.id = $1`,
    [orderId]
  );
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
}

export async function updateOrderStatus(orderId, newStatus) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the order, so two admins cannot change it at the same moment
    const { rows: [order] } = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (!order) throw new ApiError(404, 'Order not found');

    if (!TRANSITIONS[order.status].includes(newStatus)) {
      throw new ApiError(409, `Cannot change an order from ${order.status} to ${newStatus}`);
    }

    await client.query('UPDATE orders SET status = $2 WHERE id = $1', [orderId, newStatus]);
    await client.query('COMMIT');
    return { id: orderId, status: newStatus };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}