import Image from "next/image";
import hero from "@/assets/hero.jpg";

// Shared layout for the login and register pages: photo on the left (large screens), form on the right.
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
    <div className="grid min-h-[640px] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src={hero}
          alt=""
          fill
          sizes="50vw"
          placeholder="blur"
          className="object-cover object-[70%_center]"
        />
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-medium">{title}</h1>
          <p className="mt-2 text-brown">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm">{footer}</p>
        </div>
      </div>
    </div>
  );
}
