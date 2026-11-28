"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";
import { getAdminOrder, setOrderStatus, type AdminOrderDetail } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { formatVariantLabel, orderRef } from "@/components/orders/helpers";
import { ErrorNote, shortDate } from "./ui";

export function AdminOrderDetailView({ id }: { id: string }) {
  const { token } = useAuth();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getAdminOrder(token, id)
      .then((res) => {
        if (!cancelled) setOrder(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load this order.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  async function move(status: "shipped" | "delivered") {
    if (!token) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await setOrderStatus(token, id, status);
      setOrder(res.data);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update the order.");
    } finally {
      setSaving(false);
    }
  }

  const back = (
    <Link href="/admin/orders" className="text-sm font-semibold text-forest hover:text-terracotta">
      ← All orders
    </Link>
  );

  if (error) {
    return (
      <>
        {back}
        <div className="mt-6">
          <ErrorNote message={error} />
        </div>
      </>
    );
  }
  if (!order) return <div className="h-64 animate-pulse rounded-2xl bg-sand" aria-busy="true" />;

  const s = order.shipping;
  const next =
    order.status === "paid"
      ? { to: "shipped" as const, label: "Mark as shipped" }
      : order.status === "shipped"
        ? { to: "delivered" as const, label: "Mark as delivered" }
        : null;

  return (
    <>
      {back}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-medium">Order #{orderRef(order.id)}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        {next && (
          <button
            type="button"
            disabled={saving}
            onClick={() => move(next.to)}
            className="h-11 rounded-full bg-forest px-6 text-sm font-semibold text-cream hover:bg-forest-light disabled:opacity-50"
          >
            {saving ? "Saving..." : next.label}
          </button>
        )}
      </div>
      <p className="mt-2 text-sm">
        Placed {shortDate(order.createdAt)}
        {order.paidAt && ` · Paid ${shortDate(order.paidAt)}`}
      </p>
      <div className="mt-4">
        <ErrorNote message={actionError} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-label="Items" className="rounded-2xl border border-sand-dark bg-cream p-6">
          <h2 className="text-xl font-semibold">Items</h2>
          <ul className="mt-3 divide-y divide-sand-dark">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-forest">{i.productName}</p>
                  <p>{formatVariantLabel(i.variantLabel)}</p>
                  <p>
                    {formatPrice(i.unitPriceCents)} × {i.quantity}
                  </p>
                </div>
                <p className="font-medium text-forest">{formatPrice(i.lineTotalCents)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-2 flex flex-col gap-2 border-t border-sand-dark pt-4 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotalCents)}</dd>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between">
                <dt>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt>
                <dd>−{formatPrice(order.discountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-forest">
              <dt>Total</dt>
              <dd>{formatPrice(order.totalCents)}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-col gap-6">
          <section aria-label="Customer" className="rounded-2xl border border-sand-dark bg-cream p-6 text-sm">
            <h2 className="text-xl font-semibold">Customer</h2>
            {order.customer ? (
              <>
                <p className="mt-3 font-medium text-forest">{order.customer.name}</p>
                <p>{order.customer.email}</p>
              </>
            ) : (
              <p className="mt-3">Deleted account</p>
            )}
          </section>
          <section aria-label="Shipping address" className="rounded-2xl border border-sand-dark bg-cream p-6 text-sm">
            <h2 className="text-xl font-semibold">Ship to</h2>
            <address className="mt-3 not-italic leading-relaxed">
              <p className="font-medium text-forest">{s.name}</p>
              <p>{s.street}</p>
              <p>{[s.city, s.state, s.zip].filter(Boolean).join(", ")}</p>
              <p>{s.country}</p>
              <p className="mt-2">{s.phone}</p>
            </address>
          </section>
        </div>
      </div>
    </>
  );
}
