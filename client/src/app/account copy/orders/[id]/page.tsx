import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { OrderDetailView } from "@/components/orders/OrderDetailView";

export const metadata: Metadata = { title: "Order details" };

// params is a Promise in this version of Next.js, and RequireAuth reads the current path,
// so both are used inside a Suspense boundary.
async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireAuth>
      <OrderDetailView id={id} />
    </RequireAuth>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <Detail params={params} />
    </Suspense>
  );
}
