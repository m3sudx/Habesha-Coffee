"use client";

import type { Pagination } from "@/lib/api/client";

// Shared look for the admin screens.

export const adminInput =
  "h-11 w-full rounded-full border-2 border-sand-dark bg-cream px-4 text-sm text-forest placeholder:text-brown/50";

export const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brown";
export const td = "px-4 py-3 align-middle text-sm";

export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-3xl font-medium">{title}</h1>
      {children}
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
      {message}
    </p>
  );
}

export function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-2xl bg-sand" />
      ))}
    </div>
  );
}

export function Pager({
  pagination,
  onPage,
}: {
  pagination: Pagination | null;
  onPage: (page: number) => void;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const btn =
    "rounded-full border-2 border-forest px-5 py-2 text-sm font-semibold text-forest disabled:opacity-40";
  return (
    <nav aria-label="Pages" className="mt-6 flex items-center justify-between">
      <button type="button" className={btn} disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>
        Previous
      </button>
      <span className="text-sm">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <button
        type="button"
        className={btn}
        disabled={pagination.page >= pagination.totalPages}
        onClick={() => onPage(pagination.page + 1)}
      >
        Next
      </button>
    </nav>
  );
}

// "2026-11-28T..." -> "Nov 28, 2026"
export function shortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Dollars typed by the admin ("18.50") -> cents (1850). Returns null if it isn't a valid amount.
export function dollarsToCents(text: string): number | null {
  const n = Number(text.trim());
  if (!text.trim() || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}
