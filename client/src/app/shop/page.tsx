import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api/catalog";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { SortSelect } from "@/components/shop/SortSelect";
import { Pagination } from "@/components/shop/Pagination";
import { btnPrimary } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse our specialty Ethiopian coffees.",
};

const PAGE_SIZE = 9;

function toInt(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;

  // Keep only the first value of each parameter.
  const current = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) current.set(key, first);
  }

  const sortParam = current.get("sort") as ProductSort | null;
  const sort: ProductSort = sortParam && PRODUCT_SORTS.includes(sortParam) ? sortParam : "newest";
  const page = Math.max(1, toInt(current.get("page") ?? undefined) ?? 1);

  let minPrice = toInt(current.get("minPrice") ?? undefined);
  let maxPrice = toInt(current.get("maxPrice") ?? undefined);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice]; // the API rejects min > max
  }

  const [productsRes, categoriesRes] = await Promise.all([
    getProducts({
      page,
      limit: PAGE_SIZE,
      q: current.get("q") ?? undefined,
      category: current.get("category") ?? undefined,
      minPrice,
      maxPrice,
      sort,
    }),
    getCategories(),
  ]);

  const products = productsRes.data;
  const pagination = productsRes.pagination;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
          <span className="h-px w-8 bg-terracotta" aria-hidden="true" />
          Our Coffee
        </p>
        <h1 className="mt-3 text-4xl font-medium sm:text-5xl">Shop</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <ShopFilters categories={categoriesRes.data} />

        <section aria-label="Products">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm">
              {pagination ? `${pagination.total} ${pagination.total === 1 ? "coffee" : "coffees"}` : ""}
            </p>
            <SortSelect value={sort} />
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-sand p-12 text-center">
              <h2 className="text-2xl font-medium">No coffees match your filters</h2>
              <p>Try a different search or clear the filters.</p>
              <Link href="/shop" className={btnPrimary}>
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {pagination && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} current={current} />
          )}
        </section>
      </div>
    </div>
  );
}
