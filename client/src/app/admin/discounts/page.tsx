import type { Metadata } from "next";
import { AdminDiscounts } from "@/components/admin/AdminDiscounts";

export const metadata: Metadata = { title: "Discounts" };

export default function AdminDiscountsPage() {
  return <AdminDiscounts />;
}
