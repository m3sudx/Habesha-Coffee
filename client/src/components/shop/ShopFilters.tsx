"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Category } from "@/lib/types";
import { shopHref } from "@/lib/shop-url";
import { btnPrimary } from "@/components/ui/styles";

const inputClass =
  "h-11 w-full rounded-full border-2 border-sand-dark bg-cream px-4 text-sm text-forest placeholder:text-brown/60";

// Prices are dollars in the form and cents in the URL (the API works in cents).
function centsToDollars(cents: string | null): string {
  const n = Number(cents);
  return cents && Number.isFinite(n) ? String(n / 100) : "";
}

function dollarsToCents(dollars: string): string | undefined {
  const n = Number(dollars);
  return dollars.trim() !== "" && Number.isFinite(n) && n >= 0 ? String(Math.round(n * 100)) : undefined;
}

export function ShopFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const activeCategory = params.get("category");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [min, setMin] = useState(centsToDollars(params.get("minPrice")));
  const [max, setMax] = useState(centsToDollars(params.get("maxPrice")));

  const hasFilters = ["q", "category", "minPrice", "maxPrice"].some((key) => params.get(key));

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(shopHref(params, { q: q.trim() || undefined }));
  }

  function submitPrice(e: React.FormEvent) {
    e.preventDefault();
    let minCents = dollarsToCents(min);
    let maxCents = dollarsToCents(max);
    // If someone types the numbers the wrong way round, fix it instead of showing an error.
    if (minCents && maxCents && Number(minCents) > Number(maxCents)) {
      [minCents, maxCents] = [maxCents, minCents];
      setMin(centsToDollars(minCents));
      setMax(centsToDollars(maxCents));
    }
    router.push(shopHref(params, { minPrice: minCents, maxPrice: maxCents }));
  }

  return (
    <aside className="flex flex-col gap-8" aria-label="Filters">
      <form onSubmit={submitSearch} role="search" className="relative">
        <label htmlFor="shop-search" className="sr-only">
          Search coffees
        </label>
        <input
          id="shop-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search coffees"
          className={`${inputClass} pr-12`}
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-forest text-cream hover:bg-forest-light"
        >
          <Search size={16} aria-hidden="true" />
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Category</h2>
        <ul className="flex flex-col gap-1">
          <li>
            <Link
              href={shopHref(params, { category: undefined })}
              aria-current={!activeCategory ? "true" : undefined}
              className={`block rounded-xl px-4 py-2.5 text-sm font-medium ${
                !activeCategory ? "bg-forest text-cream" : "text-forest hover:bg-sand"
              }`}
            >
              All coffees
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={shopHref(params, { category: c.slug })}
                aria-current={activeCategory === c.slug ? "true" : undefined}
                className={`block rounded-xl px-4 py-2.5 text-sm font-medium ${
                  activeCategory === c.slug ? "bg-forest text-cream" : "text-forest hover:bg-sand"
                }`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={submitPrice}>
        <h2 className="mb-3 text-lg font-semibold">Price (USD)</h2>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="min-price">
            Minimum price
          </label>
          <input
            id="min-price"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className={inputClass}
          />
          <span aria-hidden="true">–</span>
          <label className="sr-only" htmlFor="max-price">
            Maximum price
          </label>
          <input
            id="max-price"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className={inputClass}
          />
        </div>
        <button type="submit" className={`${btnPrimary} mt-3 w-full`}>
          Apply
        </button>
      </form>

      {hasFilters && (
        <Link href="/shop" className="text-sm font-semibold text-terracotta underline">
          Clear all filters
        </Link>
      )}
    </aside>
  );
}
