import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts } from "@/lib/api/catalog";
import { ProductCard } from "@/components/product/ProductCard";

export async function FeaturedProducts() {
  // If the API is down the rest of the Home page should still render.
  const products = await getProducts({ limit: 4, sort: "newest" })
    .then((res) => res.data)
    .catch(() => null);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            <span className="h-px w-8 bg-terracotta" aria-hidden="true" />
            Our Coffee
          </p>
          <h2 className="mt-3 text-3xl font-medium sm:text-4xl">Discover Our Specialty Coffees</h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-forest hover:text-terracotta"
        >
          View all Products
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {products === null && (
        <p className="mt-10 rounded-2xl bg-sand p-6 text-center">
          Our coffees are unavailable right now. Please try again in a moment.
        </p>
      )}
      {products && products.length === 0 && (
        <p className="mt-10 rounded-2xl bg-sand p-6 text-center">New coffees are coming soon.</p>
      )}
      {products && products.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
