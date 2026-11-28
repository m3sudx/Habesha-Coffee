import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOrderDetailView } from "@/components/admin/AdminOrderDetail";

export const metadata: Metadata = { title: "Order" };

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminOrderDetailView id={id} />;
}

export default function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <Detail params={params} />
    </Suspense>
  );
}
