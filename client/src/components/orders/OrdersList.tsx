"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { listMyOrders, type OrderSummary } from "@/lib/api/orders";
import type { Pagination } from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { btnPrimary } from "@/components/ui/styles";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatDate, orderRef } from "./helpers";

export function OrdersList() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    listMyOrders(token, page)
      .then((res) => {
        if (cancelled) return;
        setError(null);
        setOrders(res.data);
        setPagination(res.pagination ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load your orders.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, page]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/account" className="text-sm font-semibold text-forest hover:text-terracotta">
        ← My account
      </Link>
      <h1 className="mt-4 text-4xl font-medium">My Orders</h1>

      {error ? (
        <p role="alert" className="mt-8 rounded-2xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
          {error}
        </p>
      ) : orders === null ? (
        <div className="mt-8 flex flex-col gap-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sand text-forest">
            <Package size={36} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-medium">No orders yet</h2>
          <p>When you place an order, it will show up here.</p>
          <Link href="/shop" className={btnPrimary}>
            Browse our coffees
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 flex flex-col gap-4">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-sand-dark bg-cream p-5 transition hover:border-forest"
                >
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-forest">Order #{orderRef(o.id)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="text-sm">
                      {formatDate(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-xl font-medium text-forest">
                      {formatPrice(o.totalCents)}
                    </span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {pagination && pagination.totalPages > 1 && (
            <nav aria-label="Orders pages" className="mt-8 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full border-2 border-forest px-5 py-2 text-sm font-semibold text-forest disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border-2 border-forest px-5 py-2 text-sm font-semibold text-forest disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
