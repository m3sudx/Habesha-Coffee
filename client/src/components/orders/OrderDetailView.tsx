"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";
import { getMyOrder, type OrderDetail } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatDate, formatVariantLabel, orderRef } from "./helpers";

export function OrderDetailView({ id }: { id: string }) {
  const { token } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getMyOrder(token, id)
      .then((res) => {
        if (!cancelled) setOrder(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        const notFound = err instanceof ApiError && (err.status === 404 || err.status === 400);
        setError({
          message: notFound
            ? "We could not find this order."
            : err instanceof ApiError
              ? err.message
              : "Could not load this order.",
          notFound,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  const back = (
    <Link href="/account/orders" className="text-sm font-semibold text-forest hover:text-terracotta">
      ← My orders
    </Link>
  );

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        {back}
        <p role="alert" className="mt-8 rounded-2xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
          {error.message}
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6" aria-busy="true">
        <div className="h-10 w-56 animate-pulse rounded-full bg-sand" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  const s = order.shipping;
  const addressLine = [s.city, s.state, s.zip].filter(Boolean).join(", ");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      {back}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="text-4xl font-medium">Order #{orderRef(order.id)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-sm">
        Placed on {formatDate(order.createdAt)}
        {order.paidAt && ` · Paid on ${formatDate(order.paidAt)}`}
      </p>

      {order.status === "pending" && (
        <p className="mt-6 rounded-2xl bg-gold/20 px-4 py-3 text-sm">
          We have not received the payment for this order yet. If you just paid, this can take a few
          seconds. Refresh the page in a moment.
        </p>
      )}

      <section aria-label="Items" className="mt-8 rounded-2xl border border-sand-dark bg-cream p-6">
        <h2 className="text-2xl font-semibold">Items</h2>
        <ul className="mt-4 divide-y divide-sand-dark">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="font-semibold text-forest">{item.productName}</p>
                <p className="text-sm">{formatVariantLabel(item.variantLabel)}</p>
                <p className="text-sm">
                  {formatPrice(item.unitPriceCents)} × {item.quantity}
                </p>
              </div>
              <p className="font-medium text-forest">{formatPrice(item.lineTotalCents)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-2 flex flex-col gap-3 border-t border-sand-dark pt-5 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-medium text-forest">{formatPrice(order.subtotalCents)}</dd>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-forest-light">
              <dt>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt>
              <dd className="font-medium">−{formatPrice(order.discountCents)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-sand-dark pt-4">
            <dt className="text-base font-semibold text-forest">Total</dt>
            <dd className="font-serif text-3xl font-medium text-forest">{formatPrice(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <section aria-label="Shipping address" className="mt-6 rounded-2xl border border-sand-dark bg-cream p-6">
        <h2 className="text-2xl font-semibold">Shipping to</h2>
        <address className="mt-3 not-italic leading-relaxed">
          <p className="font-medium text-forest">{s.name}</p>
          <p>{s.street}</p>
          <p>{addressLine}</p>
          <p>{s.country}</p>
          <p className="mt-2 text-sm">{s.phone}</p>
        </address>
      </section>
    </div>
  );
}
