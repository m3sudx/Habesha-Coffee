import Image from "next/image";
import logo from "@/assets/logo-mark.png";

// Decorative band inspired by Ethiopian tibeb embroidery.
function TibebBand() {
  return (
    <svg width="100%" height="16" className="block" aria-hidden="true">
      <defs>
        <pattern id="tibeb" width="32" height="16" patternUnits="userSpaceOnUse">
          <rect width="32" height="16" fill="#1f3b2d" />
          <path d="M8 2 L14 8 L8 14 L2 8 Z" fill="#c79a4b" />
          <path d="M24 2 L30 8 L24 14 L18 8 Z" fill="none" stroke="#c79a4b" strokeWidth="1.5" />
          <circle cx="16" cy="8" r="2" fill="#b5683f" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill="url(#tibeb)" />
    </svg>
  );
}

// Shared layout for the login and register pages: a centered card on a sand background.
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="bg-sand">
      <TibebBand />
      <div className="mx-auto flex min-h-160 w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-sand-dark bg-cream p-8 shadow-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <Image src={logo} alt="" className="h-auto w-16" priority />
            <h1 className="mt-4 text-3xl font-medium sm:text-4xl">{title}</h1>
            <p className="mt-2 text-brown">{subtitle}</p>
          </div>

          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm">{footer}</p>
        </div>
      </div>
    </div>
  );
}