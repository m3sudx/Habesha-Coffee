"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/features/cart/CartProvider";

// The cart button in the header, with the number of items in the cart.
export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={itemCount > 0 ? `Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}` : "Cart"}
      className="relative flex h-11 w-11 items-center justify-center rounded-full bg-forest text-cream hover:bg-forest-light"
    >
      <ShoppingBag size={20} aria-hidden="true" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-forest"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
