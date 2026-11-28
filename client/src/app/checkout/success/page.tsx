import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessView } from "@/components/checkout/SuccessView";

export const metadata: Metadata = { title: "Order received" };

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessView />
    </Suspense>
  );
}
