"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import { formatGrind, formatPrice, formatSize } from "@/lib/format";
import { useCart } from "@/features/cart/CartProvider";
import { ProductImage } from "@/components/product/ProductImage";

const HARD_MAX = 99; // the backend's limit per line

export function CartItemRow({ item }: { item: CartItem }) {
  const { setQuantity, removeItem } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const max = Math.min(item.maxQuantity, HARD_MAX);
  const href = `/shop/${item.productSlug}`;

  async function run(action: () => Promise<void>) {
    setError(null);
    setPending(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 py-6">
      <div className="flex gap-4 sm:gap-6">
        <Link href={href} className="relative block h-24 w-24 flex-none overflow-hidden rounded-xl bg-sand sm:h-28 sm:w-28">
          <ProductImage url={item.imageUrl} alt="" sizes="112px" />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold sm:text-xl">
                <Link href={href} className="hover:text-terracotta">
                  {item.productName}
                </Link>
              </h3>
              <p className="text-sm">
                {formatSize(item.sizeGrams)} · {formatGrind(item.grind)}
              </p>
              <p className="text-sm">{formatPrice(item.unitPriceCents)} each</p>
            </div>
            <p className="flex-none font-semibold text-forest">{formatPrice(item.lineTotalCents)}</p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center rounded-full border-2 border-sand-dark">
              <button
                type="button"
                aria-label={`Decrease quantity of ${item.productName}`}
                disabled={pending || item.quantity <= 1}
                onClick={() => run(() => setQuantity(item.variantId, item.quantity - 1))}
                className="flex h-10 w-10 items-center justify-center text-forest disabled:opacity-40"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span className="min-w-8 text-center text-sm font-semibold text-forest" aria-live="polite">
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label={`Increase quantity of ${item.productName}`}
                disabled={pending || item.quantity >= max}
                onClick={() => run(() => setQuantity(item.variantId, item.quantity + 1))}
                className="flex h-10 w-10 items-center justify-center text-forest disabled:opacity-40"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => removeItem(item.variantId))}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-brown hover:bg-sand hover:text-terracotta disabled:opacity-40"
            >
              <Trash2 size={16} aria-hidden="true" />
              Remove
            </button>
          </div>
        </div>
      </div>

      {!item.available && (
        <p role="status" className="rounded-xl bg-terracotta/10 px-4 py-2.5 text-sm font-medium text-terracotta">
          {item.maxQuantity === 0
            ? "This item is out of stock. Remove it to continue."
            : `Only ${item.maxQuantity} left in stock. Lower the quantity to continue.`}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-terracotta">
          {error}
        </p>
      )}
    </li>
  );
}
