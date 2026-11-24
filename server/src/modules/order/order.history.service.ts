import { pool } from "../../config/db.js";
import { AppError } from "../../utils/error.js";
import type { OrderListQuery } from "./order.schema.js";

type OrderSummaryRow = {
  id: string;
  status: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  created_at: Date;
  paid_at: Date | null;
  item_count: number;
};

type OrderRow = {
  id: string;
  status: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  discount_code: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string | null;
  shipping_zip: string | null;
  shipping_country: string;
  created_at: Date;
  paid_at: Date | null;
};

type OrderItemRow = {
  id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string;
  unit_price_cents: number;
  quantity: number;
};

// Pending orders are unpaid attempts, so they are hidden from the history list.
export async function listOrders(userId: string, { page, limit }: OrderListQuery) {
  const [countResult, dataResult] = await Promise.all([
    pool.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM orders WHERE user_id = $1 AND status <> 'pending'",
      [userId],
    ),
    pool.query<OrderSummaryRow>(
      `SELECT o.id, o.status, o.subtotal_cents, o.discount_cents, o.total_cents,
              o.created_at, o.paid_at,
              COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0)::int
                AS item_count
       FROM orders o
       WHERE o.user_id = $1 AND o.status <> 'pending'
       ORDER BY o.created_at DESC, o.id
       LIMIT $2 OFFSET $3`,
      [userId, limit, (page - 1) * limit],
    ),
  ]);

  const total = countResult.rows[0]!.total;

  return {
    items: dataResult.rows.map((r) => ({
      id: r.id,
      status: r.status,
      subtotalCents: r.subtotal_cents,
      discountCents: r.discount_cents,
      totalCents: r.total_cents,
      itemCount: r.item_count,
      createdAt: r.created_at,
      paidAt: r.paid_at,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// The user id is part of the query, so another user's order simply isn't found (404, not 403),
// and order ids can't be probed.
export async function getOrder(userId: string, orderId: string) {
  const orderResult = await pool.query<OrderRow>(
    `SELECT o.id, o.status, o.subtotal_cents, o.discount_cents, o.total_cents,
            d.code AS discount_code,
            o.shipping_name, o.shipping_phone, o.shipping_street, o.shipping_city,
            o.shipping_state, o.shipping_zip, o.shipping_country,
            o.created_at, o.paid_at
     FROM orders o
     LEFT JOIN discount_codes d ON d.id = o.discount_code_id
     WHERE o.id = $1 AND o.user_id = $2`,
    [orderId, userId],
  );

  const order = orderResult.rows[0];
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const itemsResult = await pool.query<OrderItemRow>(
    `SELECT id, variant_id, product_name, variant_label, unit_price_cents, quantity
     FROM order_items
     WHERE order_id = $1
     ORDER BY created_at, id`,
    [orderId],
  );

  return {
    id: order.id,
    status: order.status,
    subtotalCents: order.subtotal_cents,
    discountCents: order.discount_cents,
    totalCents: order.total_cents,
    discountCode: order.discount_code,
    shipping: {
      name: order.shipping_name,
      phone: order.shipping_phone,
      street: order.shipping_street,
      city: order.shipping_city,
      state: order.shipping_state,
      zip: order.shipping_zip,
      country: order.shipping_country,
    },
    items: itemsResult.rows.map((i) => ({
      id: i.id,
      variantId: i.variant_id,
      productName: i.product_name,
      variantLabel: i.variant_label,
      unitPriceCents: i.unit_price_cents,
      quantity: i.quantity,
      lineTotalCents: i.unit_price_cents * i.quantity,
    })),
    createdAt: order.created_at,
    paidAt: order.paid_at,
  };
}