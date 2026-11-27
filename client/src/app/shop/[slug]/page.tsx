import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getProduct, getProducts } from "@/lib/api/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { VariantPicker } from "@/components/product/VariantPicker";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await getProduct(slug);
    return { title: data.name, description: data.description ?? undefined };
  } catch {
    return { title: "Coffee" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  let product;
  try {
    product = (await getProduct(slug)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Other coffees from the same category (or the newest ones), without this one.
  const related = await getProducts({ category: product.category?.slug, limit: 5 })
    .then((res) => res.data.filter((p) => p.id !== product.id).slice(0, 4))
    .catch(() => []);

  const details = [
    { label: "Origin", value: product.originInfo },
    { label: "Roast", value: product.roastInfo },
  ].filter((d) => d.value);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm">
        <Link href="/shop" className="hover:text-terracotta">
          Shop
        </Link>
        {product.category?.name && (
          <>
            {" / "}
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-terracotta">
              {product.category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="font-medium text-forest">{product.name}</span>
      </nav>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-sand-dark bg-sand">
          <ProductImage
            url={product.imageUrl}
            alt={product.name}
            sizes="(min-width: 768px) 50vw, 100vw"
            priority
          />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            {product.category?.name && (
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
                <span className="h-px w-8 bg-terracotta" aria-hidden="true" />
                {product.category.name}
              </p>
            )}
            <h1 className="mt-3 text-4xl font-medium sm:text-5xl">{product.name}</h1>
          </div>

          {product.description && <p className="text-lg">{product.description}</p>}

          <VariantPicker variants={product.variants} />

          {details.length > 0 && (
            <dl className="grid gap-4 border-t border-sand-dark pt-6 sm:grid-cols-2">
              {details.map((d) => (
                <div key={d.label} className="rounded-2xl bg-sand p-4">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-brown">{d.label}</dt>
                  <dd className="mt-1 font-medium text-forest">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20" aria-label="Related coffees">
          <h2 className="mb-8 text-3xl font-medium">You May Also Like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
