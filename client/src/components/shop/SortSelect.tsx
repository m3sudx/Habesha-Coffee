"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { shopHref } from "@/lib/shop-url";
import type { ProductSort } from "@/lib/types";

const OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A to Z)" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function SortSelect({ value }: { value: ProductSort }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="text-sm font-medium">
        Sort by
      </label>
      <select
        id="sort"
        value={value}
        onChange={(e) =>
          router.push(shopHref(params, { sort: e.target.value === "newest" ? undefined : e.target.value }))
        }
        className="h-11 rounded-full border-2 border-sand-dark bg-cream px-4 text-sm font-medium text-forest"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
