import Image from "next/image";
import Link from "next/link";
import logoDark from "@/assets/logo-mark.png"; // dark green, for light backgrounds
import logoLight from "@/assets/logo-mark-light.png"; // cream, for the dark green footer

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-3 ${light ? "text-cream" : "text-forest"}`}
      aria-label="Habesha Coffee home"
    >
      <Image src={light ? logoLight : logoDark} alt="" className="h-auto w-14" priority />
      <span className="font-serif text-xl font-semibold leading-tight">
        Habesha
        <br />
        Coffee
      </span>
    </Link>
  );
}