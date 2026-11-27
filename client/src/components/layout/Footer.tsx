import Link from "next/link";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All Products" },
      { href: "/shop?sort=popular", label: "Best Sellers" },
      { href: "/shop?sort=newest", label: "New Arrivals" },
    ],
  },
  {
    title: "Customer Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/shipping", label: "Shipping Info" },
      { href: "/returns", label: "Returns & Refunds" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/our-story", label: "Our Story" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-forest text-cream">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex max-w-xs flex-col gap-4">
          <Logo light />
          <p className="text-sm text-sand">
            Ethiopia&apos;s finest coffee, roasted fresh and shipped to your door.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 font-sans text-sm font-semibold text-cream">{col.title}</h2>
            <ul className="flex flex-col">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="block py-1.5 text-sm text-sand hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-forest-light">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-sand sm:px-6">
          <span>© {new Date().getFullYear()} Habesha Coffee. All rights reserved.</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-gold">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gold">Terms of Service</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}