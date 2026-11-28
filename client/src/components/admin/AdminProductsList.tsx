"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { listAdminProducts, type AdminProductSummary } from "@/lib/api/admin";
import { ApiError, type Pagination } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product/ProductImage";
import { btnPrimary } from "@/components/ui/styles";
import { adminInput, ErrorNote, PageHeader, Pager, TableSkeleton, td, th } from "./ui";

export function AdminProductsList() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<AdminProductSummary[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    listAdminProducts(token, { page, q, isActive: active })
      .then((res) => {
        if (cancelled) return;
        setError(null);
        setProducts(res.data);
        setPagination(res.pagination ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load products.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, page, q, active]);

  return (
    <>
      <PageHeader title="Products">
        <Link href="/admin/products/new" className={btnPrimary}>
          <Plus size={16} aria-hidden="true" />
          New product
        </Link>
      </PageHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setProducts(null);
          setPage(1);
          setQ(search.trim());
        }}
        className="mb-6 flex flex-wrap gap-3"
      >
        <input
          aria-label="Search products"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${adminInput} max-w-sm`}
        />
        <select
          aria-label="Filter by visibility"
          value={active}
          onChange={(e) => {
            setProducts(null);
            setPage(1);
            setActive(e.target.value);
          }}
          className={`${adminInput} w-auto`}
        >
          <option value="">All products</option>
          <option value="true">Visible in shop</option>
          <option value="false">Hidden</option>
        </select>
        <button type="submit" className="h-11 rounded-full bg-forest px-6 text-sm font-semibold text-cream">
          Search
        </button>
      </form>

      <ErrorNote message={error} />
      {products === null && !error ? (
        <TableSkeleton />
      ) : products && products.length === 0 ? (
        <p className="rounded-2xl bg-sand px-5 py-8 text-center">No products found.</p>
      ) : (
        products && (
          <div className="overflow-x-auto rounded-2xl border border-sand-dark bg-cream">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Category</th>
                  <th className={th}>Variants</th>
                  <th className={th}>From</th>
                  <th className={th}>Stock</th>
                  <th className={th}>Visibility</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-sand-dark hover:bg-sand/50">
                    <td className={td}>
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <span className="relative block h-12 w-12 flex-none overflow-hidden rounded-lg bg-sand">
                          <ProductImage url={p.imageUrl} alt="" sizes="48px" />
                        </span>
                        <span className="font-semibold text-forest underline">{p.name}</span>
                      </Link>
                    </td>
                    <td className={td}>{p.category?.name ?? "—"}</td>
                    <td className={td}>{p.variantCount}</td>
                    <td className={td}>{p.priceFromCents != null ? formatPrice(p.priceFromCents) : "—"}</td>
                    <td className={`${td} ${p.totalStock === 0 ? "font-semibold text-terracotta" : ""}`}>
                      {p.totalStock}
                    </td>
                    <td className={td}>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          p.isActive ? "bg-forest/10 text-forest" : "bg-sand-dark text-brown"
                        }`}
                      >
                        {p.isActive ? "Visible" : "Hidden"}
                      </span>
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
          setProducts(null);
          setPage(p);
        }}
      />
    </>
  );
}
