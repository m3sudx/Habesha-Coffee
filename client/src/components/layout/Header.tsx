import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "./Logo";
import { AccountNav } from "./AccountNav";
import { CartLink } from "./CartLink";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/our-story", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header>
      <div className="bg-forest px-4 py-2 text-center text-sm text-cream">
        Single-origin Ethiopian coffee, roasted fresh
      </div>

      <div className="border-b border-sand-dark bg-cream">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo />

          <nav aria-label="Main" className="hidden gap-8 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2 text-sm font-medium text-forest hover:text-terracotta"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <AccountNav variant="desktop" />
            <CartLink />

            {/* Mobile menu: no JavaScript needed for the open/close */}
            <details className="relative md:hidden">
              <summary
                aria-label="Menu"
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border-2 border-forest text-forest [&::-webkit-details-marker]:hidden"
              >
                <Menu size={20} aria-hidden="true" />
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-sand-dark bg-cream p-2 shadow-lg">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-forest hover:bg-sand"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-1 border-t border-sand-dark" />
                <AccountNav variant="mobile" />
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}
