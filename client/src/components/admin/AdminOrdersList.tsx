"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { listAdminOrders, type AdminOrderSummary } from "@/lib/api/admin";
import { ApiError, type Pagination } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { orderRef } from "@/components/orders/helpers";
import { adminInput, ErrorNote, PageHeader, Pager, shortDate, TableSkeleton, td, th } from "./ui";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

export function AdminOrdersList() {
  const { token } = useAuth();
  const initialStatus = useSearchParams().get("status") ?? "";
  const [status, setStatus] = useState(STATUSES.includes(initialStatus) ? initialStatus : "");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // the search that is actually applied
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<AdminOrderSummary[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    listAdminOrders(token, { page, status, q })
      .then((res) => {
        if (cancelled) return;
        setError(null);
        setOrders(res.data);
        setPagination(res.pagination ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load orders.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, page, status, q]);

  return (
    <>
      <PageHeader title="Orders" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOrders(null);
          setPage(1);
          setQ(search.trim());
        }}
        className="mb-6 flex flex-wrap gap-3"
      >
        <input
          aria-label="Search orders"
          placeholder="Search by order id, name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${adminInput} max-w-sm`}
        />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setOrders(null);
            setPage(1);
            setStatus(e.target.value);
          }}
          className={`${adminInput} w-auto capitalize`}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-full bg-forest px-6 text-sm font-semibold text-cream">
          Search
        </button>
      </form>

      <ErrorNote message={error} />
      {orders === null && !error ? (
        <TableSkeleton />
      ) : orders && orders.length === 0 ? (
        <p className="rounded-2xl bg-sand px-5 py-8 text-center">No orders match your filters.</p>
      ) : (
        orders && (
          <div className="overflow-x-auto rounded-2xl border border-sand-dark bg-cream">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className={th}>Order</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Date</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-sand-dark hover:bg-sand/50">
                    <td className={td}>
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-forest underline">
                        #{orderRef(o.id)}
                      </Link>
                      <p className="text-xs">
                        {o.itemCount} {o.itemCount === 1 ? "item" : "items"} · {o.shippingCity}
                      </p>
                    </td>
                    <td className={td}>
                      {o.customer ? (
                        <>
                          <p className="font-medium text-forest">{o.customer.name}</p>
                          <p className="text-xs">{o.customer.email}</p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={td}>{shortDate(o.createdAt)}</td>
                    <td className={td}>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className={`${td} text-right font-medium text-forest`}>{formatPrice(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      <Pager
        pagination={pagination}
        onPage={(p) => {
          setOrders(null);
          setPage(p);
        }}
      />
    </>
  );
}
