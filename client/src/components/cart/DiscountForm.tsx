"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/features/cart/CartProvider";

export function DiscountForm() {
  const { discount, applyDiscount, removeDiscount } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter a discount code");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await applyDiscount(trimmed);
      setCode("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not apply the code. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (discount) {
    const label =
      discount.type === "percent" ? `${discount.value}% off` : `${formatPrice(discount.value)} off`;

    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-sand px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-forest">
          <Tag size={16} aria-hidden="true" />
          {discount.code}
          <span className="font-normal text-brown">({label})</span>
        </p>
        <button
          type="button"
          onClick={removeDiscount}
          aria-label="Remove discount code"
          className="flex h-8 w-8 items-center justify-center rounded-full text-brown hover:bg-cream"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="discount-code" className="text-sm font-semibold text-forest">
        Discount code
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="discount-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "discount-error" : undefined}
          className={`h-11 min-w-0 flex-1 rounded-full border-2 bg-cream px-4 text-sm uppercase text-forest ${
            error ? "border-terracotta" : "border-sand-dark"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full border-2 border-forest px-5 text-sm font-semibold text-forest hover:bg-forest hover:text-cream disabled:opacity-50"
        >
          {pending ? "..." : "Apply"}
        </button>
      </div>
      {error && (
        <p id="discount-error" role="alert" className="mt-1.5 text-sm font-medium text-terracotta">
          {error}
        </p>
      )}
    </form>
  );
}
