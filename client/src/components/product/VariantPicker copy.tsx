"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import type { Variant } from "@/lib/types";
import { ApiError } from "@/lib/api/client";
import { formatGrind, formatPrice, formatSize } from "@/lib/format";
import { useCart } from "@/features/cart/CartProvider";
import { btnPrimary } from "@/components/ui/styles";

const MAX_QTY = 10;

function pill(active: boolean) {
  return `rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition ${
    active
      ? "border-forest bg-forest text-cream"
      : "border-sand-dark bg-cream text-forest hover:border-forest"
  }`;
}

export function VariantPicker({ variants }: { variants: Variant[] }) {
  const { addItem } = useCart();

  // Start on the first variant that is in stock (or the first one at all).
  const initial = variants.find((v) => v.inStock) ?? variants[0];

  const [sizeGrams, setSizeGrams] = useState(initial?.sizeGrams);
  const [grind, setGrind] = useState(initial?.grind);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.sizeGrams))].sort((a, b) => a - b),
    [variants],
  );
  const grinds = variants.filter((v) => v.sizeGrams === sizeGrams);
  const selected = variants.find((v) => v.sizeGrams === sizeGrams && v.grind === grind);

  // Any change to the choices clears the last message.
  function resetMessages() {
    setAdded(false);
    setError(null);
  }

  function chooseSize(size: number) {
    resetMessages();
    setSizeGrams(size);
    // Keep the same grind if this size has it, otherwise use the first one available.
    const forSize = variants.filter((v) => v.sizeGrams === size);
    if (!forSize.some((v) => v.grind === grind)) setGrind(forSize[0]?.grind);
  }

  async function handleAdd() {
    if (!selected) return;
    resetMessages();
    setAdding(true);
    try {
      await addItem(selected.id, qty);
      setAdded(true);
    } catch (err) {
      // For example "Only 2 left in stock"
      setError(err instanceof ApiError ? err.message : "Could not add to cart. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  if (!initial) {
    return <p className="font-medium text-terracotta">This coffee is not available right now.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-4">
        <span className="font-serif text-4xl font-medium text-forest">
          {selected ? formatPrice(selected.priceCents) : "—"}
        </span>
        {selected && (
          <span
            className={`text-sm font-semibold ${selected.inStock ? "text-forest-light" : "text-terracotta"}`}
          >
            {selected.inStock ? "In stock" : "Out of stock"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-forest">Size</span>
        <div className="flex flex-wrap gap-3">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={size === sizeGrams}
              onClick={() => chooseSize(size)}
              className={pill(size === sizeGrams)}
            >
              {formatSize(size)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-forest">Grind</span>
        <div className="flex flex-wrap gap-3">
          {grinds.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={v.grind === grind}
              onClick={() => {
                resetMessages();
                setGrind(v.grind);
              }}
              className={pill(v.grind === grind)}
            >
              {formatGrind(v.grind)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-full border-2 border-sand-dark">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => {
              resetMessages();
              setQty((q) => Math.max(1, q - 1));
            }}
            className="flex h-11 w-11 items-center justify-center text-forest"
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <span className="min-w-8 text-center font-semibold text-forest" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => {
              resetMessages();
              setQty((q) => Math.min(MAX_QTY, q + 1));
            }}
            className="flex h-11 w-11 items-center justify-center text-forest"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selected?.inStock || adding}
          className={`${btnPrimary} flex-1 py-3.5`}
        >
          <ShoppingCart size={18} aria-hidden="true" />
          {adding ? "Adding..." : "Add to Cart"}
        </button>
      </div>

      {/* Result of the last add, announced to screen readers too */}
      <div aria-live="polite" className="min-h-6">
        {added && (
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-forest-light">
            <Check size={16} aria-hidden="true" />
            Added to your cart.
            <Link href="/cart" className="font-semibold text-forest underline">
              View cart
            </Link>
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-terracotta">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
