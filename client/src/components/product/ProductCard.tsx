import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { ProductSummary } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { btnPrimary } from "@/components/ui/styles";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: ProductSummary }) {
  const href = `/shop/${product.slug}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-sand-dark bg-cream shadow-sm transition hover:shadow-md">
      <Link href={href} className="relative block aspect-[4/3] bg-sand" tabIndex={-1} aria-hidden="true">
        <ProductImage
          url={product.imageUrl}
          alt=""
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        {product.category?.name && (
          <span className="absolute left-3 top-3 rounded-full bg-forest px-3 py-1 text-xs font-semibold text-cream">
            {product.category.name}
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-3 top-3 rounded-full bg-terracotta px-3 py-1 text-xs font-semibold text-cream">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col items-center gap-2 p-5 text-center">
        <h3 className="text-xl font-semibold">
          <Link href={href} className="hover:text-terracotta">
            {product.name}
          </Link>
        </h3>
        {product.description && (
          <p className="line-clamp-2 text-sm text-brown">{product.description}</p>
        )}
        <p className="mt-auto pt-2 text-lg font-semibold text-forest">
          <span className="text-sm font-normal text-brown">From </span>
          {formatPrice(product.priceFromCents)}
        </p>
        <Link href={href} className={`${btnPrimary} mt-1`}>
          <ShoppingCart size={16} aria-hidden="true" />
          Choose Options
        </Link>
      </div>
    </article>
  );
}
