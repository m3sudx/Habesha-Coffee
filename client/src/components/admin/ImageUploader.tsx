"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { removeProductImage, uploadProductImage, type AdminProduct } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { ProductImage } from "@/components/product/ProductImage";
import { ErrorNote } from "./ui";

const MAX_BYTES = 2 * 1024 * 1024; // the same limit as the server

export function ImageUploader({
  productId,
  imageUrl,
  onChange,
}: {
  productId: string;
  imageUrl: string | null;
  onChange: (product: AdminProduct) => void;
}) {
  const { token } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<AdminProduct>) {
    setBusy(true);
    setError(null);
    try {
      onChange(await action());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("The image must be 2 MB or smaller.");
      return;
    }
    void run(() => uploadProductImage(token, productId, file));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-sand">
        <ProductImage url={imageUrl} alt="Product photo" sizes="320px" />
      </div>
      <div className="flex flex-wrap gap-2">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} className="sr-only" id="product-image" />
        <label
          htmlFor="product-image"
          className={`flex cursor-pointer items-center gap-2 rounded-full border-2 border-forest px-5 py-2 text-sm font-semibold text-forest hover:bg-forest hover:text-cream ${
            busy ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <ImagePlus size={16} aria-hidden="true" />
          {imageUrl ? "Replace photo" : "Upload photo"}
        </label>
        {imageUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => token && run(() => removeProductImage(token, productId).then((r) => r.data))}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-brown hover:bg-sand hover:text-terracotta disabled:opacity-50"
          >
            <Trash2 size={16} aria-hidden="true" />
            Remove
          </button>
        )}
      </div>
      <p className="text-xs">JPG, PNG or WebP, up to 2 MB.</p>
      <ErrorNote message={error} />
    </div>
  );
}
