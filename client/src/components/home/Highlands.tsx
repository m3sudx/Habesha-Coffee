import Link from "next/link";
import { ArrowRight, Mountain } from "lucide-react";
import { btnPrimary } from "@/components/ui/styles";

export function Highlands() {
  return (
    <section className="bg-sand">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center sm:px-6 md:flex-row md:text-left">
        <div className="flex h-28 w-28 flex-none items-center justify-center rounded-full bg-forest text-gold">
          <Mountain size={52} strokeWidth={1.25} aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center gap-4 md:items-start">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            <span className="h-px w-8 bg-terracotta" aria-hidden="true" />
            Our Origin
          </p>
          <h2 className="text-3xl font-medium sm:text-4xl">From Ethiopia&apos;s Rich Highlands</h2>
          <p className="max-w-xl text-lg">
            We source our beans from the finest coffee-growing regions, supporting local farmers and
            communities.
          </p>
          <Link href="/our-story" className={btnPrimary}>
            Our Story
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
