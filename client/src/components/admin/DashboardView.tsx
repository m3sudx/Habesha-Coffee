"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";
import { getStats, type Stats } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { formatGrind, formatPrice, formatSize } from "@/lib/format";
import { ErrorNote, PageHeader, td, th } from "./ui";

const RANGES = [7, 30, 90];

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-sand-dark bg-cream p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-brown">{label}</p>
      <p className="mt-2 font-serif text-3xl font-medium text-forest">{value}</p>
      {hint && <p className="mt-1 text-xs">{hint}</p>}
    </div>
  );
}

function SalesChart({ data }: { data: Stats["dailySales"] }) {
  const max = Math.max(1, ...data.map((d) => d.revenueCents));
  return (
    <figure>
      <div
        className="flex h-48 items-end gap-1"
        role="img"
        aria-label={`Daily revenue for the last ${data.length} days. Highest day ${formatPrice(max)}.`}
      >
        {data.map((d) => (
          <div
            key={d.date}
            title={`${d.date.slice(0, 10)}: ${formatPrice(d.revenueCents)} (${d.orders} orders)`}
            className="min-w-0 flex-1 rounded-t bg-forest-light hover:bg-gold"
            style={{ height: `${Math.max(2, (d.revenueCents / max) * 100)}%` }}
          />
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-xs">
        <span>{data[0]?.date.slice(0, 10)}</span>
        <span>{data[data.length - 1]?.date.slice(0, 10)}</span>
      </figcaption>
    </figure>
  );
}

export function DashboardView() {
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getStats(token, days)
      .then((res) => {
        if (cancelled) return;
        setError(null);
        setStats(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load the dashboard.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, days]);

  return (
    <>
      <PageHeader title="Dashboard">
        <div className="flex gap-2" role="group" aria-label="Period">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={days === r}
              onClick={() => setDays(r)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${
                days === r ? "border-forest bg-forest text-cream" : "border-sand-dark text-forest"
              }`}
            >
              {r} days
            </button>
          ))}
        </div>
      </PageHeader>

      <ErrorNote message={error} />

      {!stats && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-sand" />
          ))}
        </div>
      )}

      {stats && (
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Revenue" value={formatPrice(stats.totals.revenueCents)} hint={`Last ${stats.period.days} days`} />
            <Tile label="Orders" value={String(stats.totals.orders)} hint={`${stats.totals.unitsSold} bags sold`} />
            <Tile label="Average order" value={formatPrice(stats.totals.averageOrderCents)} />
            <Tile
              label="Customers"
              value={String(stats.customers.total)}
              hint={`${stats.customers.newInPeriod} new in this period`}
            />
          </div>

          <section aria-label="Daily revenue" className="rounded-2xl border border-sand-dark bg-cream p-6">
            <h2 className="mb-4 text-xl font-semibold">Revenue per day</h2>
            <SalesChart data={stats.dailySales} />
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section aria-label="Top products" className="rounded-2xl border border-sand-dark bg-cream p-6">
              <h2 className="mb-4 text-xl font-semibold">Top products</h2>
              {stats.topProducts.length === 0 ? (
                <p className="text-sm">No sales in this period yet.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className={th}>Product</th>
                      <th className={`${th} text-right`}>Sold</th>
                      <th className={`${th} text-right`}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topProducts.map((p) => (
                      <tr key={p.productName} className="border-t border-sand-dark">
                        <td className={`${td} font-medium text-forest`}>{p.productName}</td>
                        <td className={`${td} text-right`}>{p.unitsSold}</td>
                        <td className={`${td} text-right`}>{formatPrice(p.revenueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section aria-label="Orders by status" className="rounded-2xl border border-sand-dark bg-cream p-6">
              <h2 className="mb-4 text-xl font-semibold">Orders by status</h2>
              <ul className="flex flex-col gap-2">
                {(Object.entries(stats.ordersByStatus) as [string, number][]).map(([status, count]) => (
                  <li key={status}>
                    <Link
                      href={`/admin/orders?status=${status}`}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm capitalize hover:bg-sand"
                    >
                      <span>{status}</span>
                      <span className="font-semibold text-forest">{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section aria-label="Low stock" className="rounded-2xl border border-sand-dark bg-cream p-6">
            <h2 className="mb-4 text-xl font-semibold">Low stock</h2>
            {stats.lowStock.length === 0 ? (
              <p className="text-sm">Everything is well stocked.</p>
            ) : (
              <ul className="divide-y divide-sand-dark">
                {stats.lowStock.map((v) => (
                  <li key={v.variantId} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span>
                      <span className="font-medium text-forest">{v.productName}</span> ·{" "}
                      {formatSize(v.sizeGrams)} · {formatGrind(v.grind)}{" "}
                      <span className="text-xs">({v.sku})</span>
                    </span>
                    <span className={`font-semibold ${v.stock === 0 ? "text-terracotta" : "text-forest"}`}>
                      {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
