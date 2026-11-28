import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { OrdersList } from "@/components/orders/OrdersList";

export const metadata: Metadata = { title: "My Orders" };

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersList />
    </RequireAuth>
  );
}
