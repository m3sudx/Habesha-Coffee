import Link from "next/link";
import { btnPrimary } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-terracotta">404</p>
      <h1 className="text-4xl font-medium">We couldn&apos;t find that page</h1>
      <p>The page you are looking for does not exist or has moved.</p>
      <Link href="/shop" className={btnPrimary}>
        Browse our coffees
      </Link>
    </div>
  );
}
