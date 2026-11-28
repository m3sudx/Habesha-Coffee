import Image from "next/image";
import { Coffee } from "lucide-react";
import { imageSrc } from "@/lib/format";

// Fills its parent, so the parent must be `relative` and have a size (for example aspect-square).
export function ProductImage({
  url,
  alt,
  sizes,
  priority = false,
}: {
  url: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const src = imageSrc(url);

  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-sand text-brown/50">
        <Coffee size={48} strokeWidth={1.25} aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      // The local dev backend is a private address, which Next's image optimizer refuses.
      unoptimized={src.includes("localhost")}
      className="object-cover"
    />
  );
}
