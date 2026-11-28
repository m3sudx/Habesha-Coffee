import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { shopHref } from "@/lib/shop-url";

export function Pagination({
  page,
  totalPages,
  current,
}: {
  page: number;
  totalPages: number;
  current: URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => shopHref(current, { page: p > 1 ? String(p) : undefined });
  const item =
    "flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold";

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={`${item} text-forest hover:bg-sand`} aria-label="Previous page">
          <ChevronLeft size={18} aria-hidden="true" />
        </Link>
      )}

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${item} ${p === page ? "bg-forest text-cream" : "text-forest hover:bg-sand"}`}
        >
          {p}
        </Link>
      ))}

      {page < totalPages && (
        <Link href={hrefFor(page + 1)} className={`${item} text-forest hover:bg-sand`} aria-label="Next page">
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
