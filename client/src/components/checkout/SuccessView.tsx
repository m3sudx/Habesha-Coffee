"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/features/cart/CartProvider";
import { btnPrimary } from "@/components/ui/styles";

export function SuccessView() {
  const orderId = useSearchParams().get("order");
  const { refresh } = useCart();

  // The server empties the cart when Stripe confirms the payment, which can take a few
  // seconds. Reload the cart now and again shortly after so the header badge clears.
  useEffect(() => {
    void refresh();
    const t1 = setTimeout(() => void refresh(), 3000);
    const t2 = setTimeout(() => void refresh(), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-forest text-cream">
        <CheckCircle2 size={40} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h1 className="text-4xl font-medium">Thank you for your order</h1>
      <p>
        We received your payment details and are confirming your order. A confirmation email will
        arrive shortly.
      </p>
      {orderId && (
        <p className="rounded-full bg-sand px-4 py-2 text-sm">
          Order reference: <span className="font-semibold text-forest">{orderId.slice(0, 8).toUpperCase()}</span>
        </p>
      )}
      <Link href="/shop" className={`${btnPrimary} mt-2`}>
        Continue shopping
      </Link>
    </div>
  );
}
