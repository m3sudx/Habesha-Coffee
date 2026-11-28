import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <>
      <Link href="/admin/products" className="text-sm font-semibold text-forest hover:text-terracotta">
        ← All products
      </Link>
      <h1 className="mb-2 mt-4 text-3xl font-medium">New product</h1>
      <p className="mb-8">Next you will add the sizes, prices and photo.</p>
      <div className="max-w-2xl">
        <ProductForm />
      </div>
    </>
  );
}
