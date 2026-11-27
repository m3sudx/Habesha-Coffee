import { api } from "./client";
import type { Category, ProductDetail, ProductSort, ProductSummary } from "@/lib/types";

export type ProductParams = {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  minPrice?: number; // cents
  maxPrice?: number; // cents
  sort?: ProductSort;
};

function toQuery(params: ProductParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// Catalog data changes rarely, so pages may reuse a cached copy for a minute.
export function getProducts(params: ProductParams = {}) {
  return api<ProductSummary[]>(`/products${toQuery(params)}`, { next: { revalidate: 60 } });
}

export function getProduct(slug: string) {
  return api<ProductDetail>(`/products/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
}

export function getCategories() {
  return api<Category[]>("/categories", { next: { revalidate: 300 } });
}
