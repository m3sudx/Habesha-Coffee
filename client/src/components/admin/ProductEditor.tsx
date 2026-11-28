"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getAdminProduct, type AdminProduct } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { ErrorNote } from "./ui";
import { ProductForm } from "./ProductForm";
import { ImageUploader } from "./ImageUploader";
import { VariantsEditor } from "./VariantsEditor";

export function ProductEditor({ id }: { id: string }) {
  const { token } = useAuth();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [version, setVersion] = useState(0); // bump to reload the product
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getAdminProduct(token, id)
      .then((res) => {
        if (!cancelled) setProduct(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load this product.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, id, version]);

  const back = (
    <Link href="/admin/products" className="text-sm font-semibold text-forest hover:text-terracotta">
      ← All products
    </Link>
  );

  if (error) {
    return (
      <>
        {back}
        <div className="mt-6">
          <ErrorNote message={error} />
        </div>
      </>
    );
  }
  if (!product) return <div className="h-64 animate-pulse rounded-2xl bg-sand" aria-busy="true" />;

  return (
    <>
      {back}
      <div className="mb-8 mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-medium">{product.name}</h1>
        {product.isActive && (
          <Link
            href={`/shop/${product.slug}`}
            className="flex items-center gap-2 text-sm font-semibold text-forest underline"
          >
            View in shop
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-10">
          <section aria-label="Details">
            <h2 className="mb-4 text-xl font-semibold">Details</h2>
            {/* The key reloads the form's fields after a save, so the saved slug shows. */}
            <ProductForm key={`${product.id}-${product.slug}`} product={product} onSaved={setProduct} />
          </section>

          <section aria-label="Sizes and prices">
            <h2 className="mb-4 text-xl font-semibold">Sizes, prices and stock</h2>
            <VariantsEditor productId={product.id} variants={product.variants} onChanged={reload} />
          </section>
        </div>

        <section aria-label="Photo">
          <h2 className="mb-4 text-xl font-semibold">Photo</h2>
          <ImageUploader productId={product.id} imageUrl={product.imageUrl} onChange={setProduct} />
        </section>
      </div>
    </>
  );
}
