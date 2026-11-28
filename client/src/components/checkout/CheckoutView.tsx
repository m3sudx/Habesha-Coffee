"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCart } from "@/features/cart/CartProvider";
import { shippingSchema, type ShippingValues } from "@/features/checkout/schemas";
import { createCheckout } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatGrind, formatPrice, formatSize } from "@/lib/format";
import { TextField } from "@/components/ui/TextField";
import { btnPrimary } from "@/components/ui/styles";
import { ProductImage } from "@/components/product/ProductImage";

const FIELDS = ["name", "phone", "street", "city", "state", "zip", "country"] as const;

export function CheckoutView() {
  const { user, token } = useAuth();
  const { cart, ready, discount } = useCart();
  const [formError, setFormError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ShippingValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  });

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6" aria-busy="true">
        <div className="h-12 w-56 animate-pulse rounded-full bg-sand" />
        <div className="mt-8 h-72 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-3xl font-medium">Your cart is empty</h1>
        <p>Add a coffee to your cart before checking out.</p>
        <Link href="/shop" className={btnPrimary}>
          Browse our coffees
        </Link>
      </div>
    );
  }

  const blocked = cart.items.some((i) => !i.available);
  const discountCents = Math.min(discount?.discountCents ?? 0, cart.subtotalCents);
  const total = cart.subtotalCents - discountCents;

  async function onSubmit(values: ShippingValues) {
    if (!token || blocked) return;
    setFormError(null);
    try {
      const res = await createCheckout(
        token,
        {
          name: values.name,
          phone: values.phone,
          street: values.street,
          city: values.city,
          country: values.country,
          ...(values.state ? { state: values.state } : {}),
          ...(values.zip ? { zip: values.zip } : {}),
        },
        discount?.code,
      );
      // Leave for Stripe's payment page. The cart stays until the payment is confirmed.
      setRedirecting(true);
      window.location.assign(res.data.checkoutUrl);
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setFormError("Something went wrong. Please try again.");
        return;
      }
      // Validation errors come as [{ field: "shipping.city", message }]
      const details = Array.isArray(err.details) ? err.details : [];
      let shown = false;
      for (const item of details as { field?: unknown; message?: unknown }[]) {
        if (typeof item.field !== "string" || typeof item.message !== "string") continue;
        const name = item.field.replace(/^shipping\./, "");
        if ((FIELDS as readonly string[]).includes(name)) {
          setError(name as keyof ShippingValues, { message: item.message });
          shown = true;
        }
      }
      if (!shown) setFormError(err.message);
    }
  }

  const busy = isSubmitting || redirecting;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-medium">Checkout</h1>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
        <form
          id="checkout-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-5"
        >
          <h2 className="text-2xl font-semibold">Shipping address</h2>

          {formError && (
            <p
              role="alert"
              className="rounded-2xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta"
            >
              {formError}
            </p>
          )}

          <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
          <TextField
            label="Phone"
            type="tel"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <TextField
            label="Street address"
            autoComplete="street-address"
            error={errors.street?.message}
            {...register("street")}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="City"
              autoComplete="address-level2"
              error={errors.city?.message}
              {...register("city")}
            />
            <TextField
              label="State / region (optional)"
              autoComplete="address-level1"
              error={errors.state?.message}
              {...register("state")}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="ZIP / postal code (optional)"
              autoComplete="postal-code"
              error={errors.zip?.message}
              {...register("zip")}
            />
            <TextField
              label="Country"
              autoComplete="country-name"
              error={errors.country?.message}
              {...register("country")}
            />
          </div>
        </form>

        <aside
          aria-label="Order summary"
          className="flex flex-col gap-5 rounded-2xl border border-sand-dark bg-cream p-6 shadow-sm lg:sticky lg:top-6"
        >
          <h2 className="text-2xl font-semibold">Order Summary</h2>

          <ul className="flex flex-col gap-4">
            {cart.items.map((item) => (
              <li key={item.variantId} className="flex gap-3">
                <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg bg-sand">
                  <ProductImage url={item.imageUrl} alt="" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-forest">{item.productName}</p>
                  <p>
                    {formatSize(item.sizeGrams)} · {formatGrind(item.grind)} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium text-forest">{formatPrice(item.lineTotalCents)}</p>
              </li>
            ))}
          </ul>

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

          {blocked ? (
            <p className="text-center text-sm font-medium text-terracotta">
              Some items are unavailable.{" "}
              <Link href="/cart" className="underline">
                Go back to your cart
              </Link>
            </p>
          ) : (
            <button type="submit" form="checkout-form" disabled={busy} className={`${btnPrimary} py-3.5`}>
              <Lock size={16} aria-hidden="true" />
              {redirecting ? "Redirecting to payment..." : isSubmitting ? "Please wait..." : "Pay securely"}
            </button>
          )}
          <p className="text-center text-xs">
            You will pay on Stripe&apos;s secure page. We never see your card details.
          </p>
          <Link href="/cart" className="text-center text-sm font-semibold text-forest hover:text-terracotta">
            ← Back to cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
