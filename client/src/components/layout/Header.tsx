import Link from "next/link";
import { Logo } from "./Logo";
import { ShoppingCart } from "lucide-react";

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
            <Link
              href="/login"
              className="hidden px-3 py-2 text-sm font-medium text-forest hover:text-terracotta sm:block"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="hidden rounded-full border-2 border-forest px-5 py-2 text-sm font-semibold text-forest hover:bg-forest hover:text-cream sm:block"
            >
              Sign Up
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-forest text-cream hover:bg-forest-light"
            >
              <ShoppingCart size={20} aria-hidden="true" />
              {/* The real count comes from the cart in F3 */}
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-forest">
                0
              </span>
            </Link>

            {/* Mobile menu: no JavaScript needed */}
            <details className="relative md:hidden">
              <summary
                aria-label="Menu"
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border-2 border-forest text-forest [&::-webkit-details-marker]:hidden"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-sand-dark bg-cream p-2 shadow-lg">
                {[...NAV, { href: "/login", label: "Log In" }, { href: "/register", label: "Sign Up" }].map(
                  (item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-xl px-4 py-3 text-sm font-medium text-forest hover:bg-sand"
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}