import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { btnOutline, btnPrimary } from "@/components/ui/styles";

export function Hero() {
  return (
  <section className="relative flex min-h-150 items-center lg:min-h-175">
  <Image
    src={hero}
    alt="A steaming Ethiopian coffee cup"
    fill
    priority
    sizes="100vw"
    placeholder="blur"
    className="-z-20 object-cover object-[72%_95%]"
  />
      {/* Soft cream fade so the text stays readable over the leaves on the left of the photo */}
      <div className="absolute inset-0 -z-10 bg-cream/65 md:bg-transparent md:bg-linear-to-r md:from-cream/90 md:from-30% md:via-cream/40 md:via-55% md:to-transparent" />

      <div className="mx-auto flex min-h-115 w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 md:min-h-135">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
          <span className="h-px w-8 bg-terracotta" aria-hidden="true" />
          From the birthplace of coffee
        </p>
        <h1 className="mt-5 max-w-xl text-5xl font-medium leading-[1.05] sm:text-6xl">
          A Taste of Ethiopia in Every Cup.
        </h1>
        <p className="mt-5 max-w-md text-lg text-brown">
          Discover our carefully sourced specialty coffee, from the highlands of
          Ethiopia.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/shop" className={btnPrimary}>
            Shop Our Coffee
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/our-story" className={btnOutline}>
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}
