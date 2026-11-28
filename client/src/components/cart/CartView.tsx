"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCart } from "@/features/cart/CartProvider";
import { formatPrice } from "@/lib/format";
import { btnPrimary } from "@/components/ui/styles";
import { CartItemRow } from "./CartItemRow";
import { DiscountForm } from "./DiscountForm";

export function CartView() {
  const { cart, ready, discount } = useCart();
  const { status } = useAuth();

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6" aria-busy="true">
        <div className="h-12 w-56 animate-pulse rounded-full bg-sand" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="h-64 animate-pulse rounded-2xl bg-sand" />
          <div className="h-72 animate-pulse rounded-2xl bg-sand" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sand text-forest">
          <ShoppingBag size={36} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-medium">Your cart is empty</h1>
        <p>Find something you like in our collection of Ethiopian coffees.</p>
        <Link href="/shop" className={btnPrimary}>
          Browse our coffees
        </Link>
      </div>
    );
  }

  const discountCents = Math.min(discount?.discountCents ?? 0, cart.subtotalCents);
  const total = cart.subtotalCents - discountCents;
  const canCheckout = cart.subtotalCents > 0 && cart.items.every((i) => i.available);
  const isGuest = status !== "authenticated";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-medium">Your Cart</h1>
      <p className="mt-2">
        {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
      </p>

      {isGuest && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sand px-5 py-4 text-sm">
          <span>Shopping as a guest? Log in to check out. Your cart will be kept.</span>
          <Link
            href="/login?next=/cart"
            className="rounded-full bg-forest px-5 py-2 font-semibold text-cream hover:bg-forest-light"
          >
            Log in or sign up
          </Link>
        </div>
      )}

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
        <section aria-label="Items in your cart">
          <ul className="divide-y divide-sand-dark border-y border-sand-dark">
            {cart.items.map((item) => (
              <CartItemRow key={item.variantId} item={item} />
            ))}
          </ul>
          <Link href="/shop" className="mt-6 inline-block py-2 text-sm font-semibold text-forest hover:text-terracotta">
            ← Continue shopping
          </Link>
        </section>

        <aside
          aria-label="Order summary"
          className="flex flex-col gap-5 rounded-2xl border border-sand-dark bg-cream p-6 shadow-sm lg:sticky lg:top-6"
        >
          <h2 className="text-2xl font-semibold">Order Summary</h2>

          <DiscountForm />

          <dl className="flex flex-col gap-3 border-t border-sand-dark pt-5 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-medium text-forest">{formatPrice(cart.subtotalCents)}</dd>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between text-forest-light">
                <dt>Discount ({discount?.code})</dt>
                <dd className="font-medium">−{formatPrice(discountCents)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-sand-dark pt-4">
              <dt className="text-base font-semibold text-forest">Total</dt>
              <dd className="font-serif text-3xl font-medium text-forest">{formatPrice(total)}</dd>
            </div>
          </dl>

          {canCheckout ? (
            <Link
              href={isGuest ? "/login?next=/checkout" : "/checkout"}
              className={`${btnPrimary} py-3.5`}
            >
              {isGuest ? "Log in to Check Out" : "Proceed to Checkout"}
            </Link>
          ) : (
            <>
              <button type="button" disabled className={`${btnPrimary} py-3.5`}>
                Proceed to Checkout
              </button>
              <p className="text-center text-sm text-terracotta">
                Fix the unavailable items above to continue.
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
