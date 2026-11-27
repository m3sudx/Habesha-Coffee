import Link from "next/link";

// Placeholder mark (sunburst). When you have the real logo file, put it in public/
// and replace the <svg> with <Image src="/logo.svg" ... />.
export function Logo({ light = false }: { light?: boolean }) {
  const color = light ? "text-cream" : "text-forest";

  return (
    <Link href="/" className={`flex items-center gap-3 ${color}`} aria-label="Habesha Coffee home">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20 3v6M20 31v6M3 20h6M31 20h6M8 8l4 4M28 28l4 4M32 8l-4 4M12 28l-4 4" />
        </g>
        <circle cx="20" cy="20" r="7" fill="currentColor" />
      </svg>
      <span className="font-serif text-xl font-semibold leading-tight">
        Habesha
        <br />
        Coffee
      </span>
    </Link>
  );
}