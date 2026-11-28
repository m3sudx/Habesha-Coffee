"use client";

import { btnPrimary } from "@/components/ui/styles";

export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-medium">We could not load the coffees</h1>
      <p>Something went wrong while contacting the shop. Please try again.</p>
      <button type="button" onClick={reset} className={btnPrimary}>
        Try again
      </button>
    </div>
  );
}
