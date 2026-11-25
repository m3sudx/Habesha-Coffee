import { pool } from "../../config/db.js";
import type { StatsQuery } from "./admin-stats.schema.js";

// An order counts as a sale once it has been paid (and stays one while it ships/arrives).
// Pending and cancelled orders are not revenue.
const SALE_STATUSES = ["paid", "shipped", "delivered"];

export async function getSalesOverview({ days, lowStock }: StatsQuery) {
  // Start of the first day in the range, in UTC. days=1 means "today only".
  const since = (n: number) =>
    `date_trunc('day', now() AT TIME ZONE 'UTC') - make_interval(days => $${n}::int - 1)`;
  const sinceSql = since(2);

  const [totals, daily, topProducts, statuses, customers, lowStockRows] = await Promise.all([
    // Headline numbers for the period
    pool.query<{
      revenue_cents: string;
      orders: number;
      discount_cents: string;
      units: string;
    }>(
      `SELECT COALESCE(SUM(o.total_cents), 0) AS revenue_cents,
              COUNT(*)::int AS orders,
              COALESCE(SUM(o.discount_cents), 0) AS discount_cents,
              COALESCE(SUM((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id)), 0) AS units
       FROM orders o
       WHERE o.status = ANY($1) AND o.paid_at IS NOT NULL
         AND (o.paid_at AT TIME ZONE 'UTC') >= ${sinceSql}`,
      [SALE_STATUSES, days],
    ),

    // One row per day, including days with no sales (generate_series fills the gaps with 0)
    pool.query<{ day: string; revenue_cents: string; orders: number }>(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
              COALESCE(SUM(o.total_cents), 0) AS revenue_cents,
              COUNT(o.id)::int AS orders
       FROM generate_series((${sinceSql})::date, (now() AT TIME ZONE 'UTC')::date, '1 day') AS d(day)
       LEFT JOIN orders o
         ON o.status = ANY($1) AND o.paid_at IS NOT NULL
        AND (o.paid_at AT TIME ZONE 'UTC')::date = d.day::date
       GROUP BY d.day
       ORDER BY d.day`,
      [SALE_STATUSES, days],
    ),

    // Best sellers. Grouped by the product name saved on the order item, so it still
    // works if the product is later renamed or removed.
    pool.query<{ product_name: string; units: string; revenue_cents: string }>(
      `SELECT oi.product_name,
              SUM(oi.quantity) AS units,
              SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status = ANY($1) AND o.paid_at IS NOT NULL
         AND (o.paid_at AT TIME ZONE 'UTC') >= ${sinceSql}
       GROUP BY oi.product_name
       ORDER BY units DESC, revenue_cents DESC
       LIMIT 5`,
      [SALE_STATUSES, days],
    ),

    // Orders by status, all time (what needs attention right now)
    pool.query<{ status: string; count: number }>(
      `SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`,
    ),

    pool.query<{ total: number; new_in_period: number }>(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'UTC') >= ${since(1)})::int AS new_in_period
       FROM users WHERE role = 'customer'`,
      [days],
    ),

    pool.query<{
      variant_id: string;
      product_name: string;
      sku: string;
      size_grams: number;
      grind: string | null;
      stock: number;
    }>(
      `SELECT v.id AS variant_id, p.name AS product_name, v.sku, v.size_grams, v.grind, v.stock
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       WHERE v.is_active AND p.is_active AND v.stock <= $1
       ORDER BY v.stock, p.name
       LIMIT 20`,
      [lowStock],
    ),
  ]);

  const t = totals.rows[0]!;
  const revenueCents = Number(t.revenue_cents);
  const orders = t.orders;

  const ordersByStatus: Record<string, number> = {
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const r of statuses.rows) ordersByStatus[r.status] = r.count;

  return {
    period: { days },
    totals: {
      revenueCents,
      orders,
      unitsSold: Number(t.units),
      discountCents: Number(t.discount_cents),
      averageOrderCents: orders > 0 ? Math.round(revenueCents / orders) : 0,
    },
    ordersByStatus,
    customers: {
      total: customers.rows[0]!.total,
      newInPeriod: customers.rows[0]!.new_in_period,
    },
    dailySales: daily.rows.map((r) => ({
      date: r.day,
      revenueCents: Number(r.revenue_cents),
      orders: r.orders,
    })),
    topProducts: topProducts.rows.map((r) => ({
      productName: r.product_name,
      unitsSold: Number(r.units),
      revenueCents: Number(r.revenue_cents),
    })),
    lowStock: lowStockRows.rows.map((r) => ({
      variantId: r.variant_id,
      productName: r.product_name,
      sku: r.sku,
      sizeGrams: r.size_grams,
      grind: r.grind,
      stock: r.stock,
    })),
  };
}