import { pool } from "../../config/db.js";
import { AppError } from "../../utils/error.js";
import type {
  AdminOrderListQuery,
  OrderStatus,
  UpdateOrderStatusInput,
} from "./admin-order.schema.js";

// Escape LIKE wildcards so a search for "100%" doesn't match everything.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

type AdminOrderSummaryRow = {
  id: string;
  status: OrderStatus;
  total_cents: number;
  created_at: Date;
  paid_at: Date | null;
  shipping_city: string;
  customer_name: string | null;
  customer_email: string | null;
  item_count: number;
};

type AdminOrderRow = {
  id: string;
  status: OrderStatus;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  discount_code: string | null;
  stripe_session_id: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string | null;
  shipping_zip: string | null;
  shipping_country: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  created_at: Date;
  paid_at: Date | null;
  updated_at: Date;
};

type OrderItemRow = {
  id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string;
  unit_price_cents: number;
  quantity: number;
};

export async function listAdminOrders({ page, limit, status, q }: AdminOrderListQuery) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  // Pushes a value and returns its placeholder ($1, $2, ...), so conditions
  // and parameters are always built together and stay in sync.
  const add = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  if (status) {
    conditions.push(`o.status = ${add(status)}`);
  }
  if (q) {
    const p = add(`%${escapeLike(q)}%`);
    conditions.push(
      `(o.id::text ILIKE ${p} OR u.email ILIKE ${p} OR u.name ILIKE ${p} OR o.shipping_name ILIKE ${p})`,
    );
  }

  const fromSql = `
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}`;

  const countParams = [...params]; // before LIMIT/OFFSET are added

  const dataSql = `
    SELECT o.id, o.status, o.total_cents, o.created_at, o.paid_at, o.shipping_city,
           u.name AS customer_name, u.email AS customer_email,
           COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0)::int
             AS item_count
    ${fromSql}
    ORDER BY o.created_at DESC, o.id
    LIMIT ${add(limit)} OFFSET ${add((page - 1) * limit)}`;

  const [countResult, dataResult] = await Promise.all([
    pool.query<{ total: number }>(`SELECT COUNT(*)::int AS total ${fromSql}`, countParams),
    pool.query<AdminOrderSummaryRow>(dataSql, params),
  ]);

  const total = countResult.rows[0]!.total;

  return {
    items: dataResult.rows.map((r) => ({
      id: r.id,
      status: r.status,
      totalCents: r.total_cents,
      itemCount: r.item_count,
      shippingCity: r.shipping_city,
      customer: r.customer_email ? { name: r.customer_name, email: r.customer_email } : null,
      createdAt: r.created_at,
      paidAt: r.paid_at,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAdminOrder(orderId: string) {
  const orderResult = await pool.query<AdminOrderRow>(
    `SELECT o.id, o.status, o.subtotal_cents, o.discount_cents, o.total_cents,
            d.code AS discount_code, o.stripe_session_id,
            o.shipping_name, o.shipping_phone, o.shipping_street, o.shipping_city,
            o.shipping_state, o.shipping_zip, o.shipping_country,
            u.id AS customer_id, u.name AS customer_name, u.email AS customer_email,
            o.created_at, o.paid_at, o.updated_at
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN discount_codes d ON d.id = o.discount_code_id
     WHERE o.id = $1`,
    [orderId],
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
    stripeSessionId: order.stripe_session_id,
    customer: order.customer_id
      ? { id: order.customer_id, name: order.customer_name, email: order.customer_email }
      : null,
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
    updatedAt: order.updated_at,
  };
}

// The status an order must have right now for each allowed move.
const REQUIRED_CURRENT_STATUS: Record<UpdateOrderStatusInput["status"], OrderStatus> = {
  shipped: "paid",
  delivered: "shipped",
};

export async function updateOrderStatus(
  orderId: string,
  newStatus: UpdateOrderStatusInput["status"],
) {
  // One guarded UPDATE: it only matches if the order is still in the required status,
  // so two admins clicking at the same time can't skip a step.
  const updated = await pool.query<{ id: string }>(
    `UPDATE orders SET status = $1 WHERE id = $2 AND status = $3 RETURNING id`,
    [newStatus, orderId, REQUIRED_CURRENT_STATUS[newStatus]],
  );

  if (updated.rowCount === 0) {
    const existing = await pool.query<{ status: OrderStatus }>(
      "SELECT status FROM orders WHERE id = $1",
      [orderId],
    );
    const current = existing.rows[0]?.status;

    if (!current) {
      throw new AppError("Order not found", 404);
    }
    throw new AppError(`Cannot change an order from "${current}" to "${newStatus}"`, 409);
  }

  return getAdminOrder(orderId);
}