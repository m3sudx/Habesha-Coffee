import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOrdersList } from "@/components/admin/AdminOrdersList";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  // The list reads ?status= from the address, which needs Suspense.
  return (
    <Suspense fallback={null}>
      <AdminOrdersList />
    </Suspense>
  );
}
