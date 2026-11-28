"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  createAdminDiscount,
  listAdminDiscounts,
  updateAdminDiscount,
  type AdminDiscount,
  type DiscountStatus,
} from "@/lib/api/admin";
import { ApiError, type Pagination } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { adminInput, dollarsToCents, ErrorNote, PageHeader, Pager, shortDate, TableSkeleton, td, th } from "./ui";

const STATUS_STYLE: Record<DiscountStatus, string> = {
  active: "bg-forest/10 text-forest",
  inactive: "bg-sand-dark text-brown",
  expired: "bg-terracotta/15 text-terracotta",
  used_up: "bg-gold/25 text-brown",
};

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [expires, setExpires] = useState("");
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (!code.trim()) return setError("Enter a code");
    let amount: number | null;
    if (type === "percent") {
      amount = Number(value);
      if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
        return setError("A percent discount must be a whole number from 1 to 100");
      }
    } else {
      amount = dollarsToCents(value);
      if (amount === null || amount < 1) return setError("Enter the amount in dollars, for example 5.00");
    }
    const limitNum = limit.trim() ? Number(limit) : null;
    if (limitNum !== null && (!Number.isInteger(limitNum) || limitNum < 1)) {
      return setError("The usage limit must be a whole number of 1 or more");
    }

    setBusy(true);
    try {
      await createAdminDiscount(token, {
        code: code.trim(),
        type,
        value: amount,
        expiresAt: expires ? `${expires}T23:59:59Z` : null,
        usageLimit: limitNum,
        isActive: true,
      });
      setCode("");
      setValue("");
      setExpires("");
      setLimit("");
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.details) && err.details.length > 0) {
        const first = err.details[0] as { message?: unknown };
        setError(typeof first.message === "string" ? first.message : err.message);
      } else {
        setError(err instanceof ApiError ? err.message : "Could not create the code.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mb-8 rounded-2xl border border-sand-dark bg-cream p-5">
      <h2 className="mb-4 text-xl font-semibold">New discount code</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input aria-label="Code" placeholder="CODE (LAUNCH15)" value={code} onChange={(e) => setCode(e.target.value)} className={`${adminInput} uppercase`} />
        <select aria-label="Type" value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")} className={adminInput}>
          <option value="percent">Percent off</option>
          <option value="fixed">Amount off ($)</option>
        </select>
        <input
          aria-label={type === "percent" ? "Percent" : "Amount in dollars"}
          placeholder={type === "percent" ? "Percent (15)" : "Dollars (5.00)"}
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={adminInput}
        />
        <input aria-label="Expiry date" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={adminInput} />
        <input aria-label="Usage limit" placeholder="Limit (optional)" inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value)} className={adminInput} />
      </div>
      <p className="mt-2 text-xs">Expiry and limit are optional. Leave them empty for no expiry or no limit.</p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className="rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-cream disabled:opacity-50">
          {busy ? "Creating..." : "Create code"}
        </button>
        <ErrorNote message={error} />
      </div>
    </form>
  );
}

export function AdminDiscounts() {
  const { token } = useAuth();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminDiscount[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0); // bump to reload
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    listAdminDiscounts(token, { page, status })
      .then((res) => {
        if (cancelled) return;
        setError(null);
        setItems(res.data);
        setPagination(res.pagination ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load discount codes.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, page, status, version]);

  async function toggle(d: AdminDiscount) {
    if (!token) return;
    setBusyId(d.id);
    setError(null);
    try {
      await updateAdminDiscount(token, d.id, { isActive: !d.isActive });
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the code.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Discount codes" />
      <CreateForm
        onCreated={() => {
          setStatus("");
          setPage(1);
          reload();
        }}
      />

      <div className="mb-4">
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setItems(null);
            setPage(1);
            setStatus(e.target.value);
          }}
          className={`${adminInput} w-auto`}
        >
          <option value="">All codes</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
          <option value="used_up">Used up</option>
        </select>
      </div>

      <ErrorNote message={error} />
      {items === null && !error ? (
        <TableSkeleton />
      ) : items && items.length === 0 ? (
        <p className="rounded-2xl bg-sand px-5 py-8 text-center">No discount codes yet.</p>
      ) : (
        items && (
          <div className="overflow-x-auto rounded-2xl border border-sand-dark bg-cream">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className={th}>Code</th>
                  <th className={th}>Discount</th>
                  <th className={th}>Used</th>
                  <th className={th}>Expires</th>
                  <th className={th}>Status</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-t border-sand-dark">
                    <td className={`${td} font-semibold text-forest`}>{d.code}</td>
                    <td className={td}>{d.type === "percent" ? `${d.value}% off` : `${formatPrice(d.value)} off`}</td>
                    <td className={td}>
                      {d.timesUsed}
                      {d.usageLimit !== null ? ` / ${d.usageLimit}` : ""}
                    </td>
                    <td className={td}>{d.expiresAt ? shortDate(d.expiresAt) : "Never"}</td>
                    <td className={td}>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[d.status]}`}>
                        {d.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className={td}>
                      <button
                        type="button"
                        disabled={busyId === d.id}
                        onClick={() => toggle(d)}
                        className="rounded-full border-2 border-forest px-4 py-1.5 text-xs font-semibold text-forest hover:bg-forest hover:text-cream disabled:opacity-50"
                      >
                        {d.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
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
          setItems(null);
          setPage(p);
        }}
      />
    </>
  );
}
