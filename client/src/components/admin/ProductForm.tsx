"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  createAdminProduct,
  updateAdminProduct,
  type AdminProduct,
  type ProductInput,
} from "@/lib/api/admin";
import { getCategories } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import type { Category } from "@/lib/types";
import { TextField } from "@/components/ui/TextField";
import { btnPrimary } from "@/components/ui/styles";
import { ErrorNote } from "./ui";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(255)
    .refine((v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), "Use lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(5000, "Too long"),
  originInfo: z.string().trim().max(255, "Too long"),
  roastInfo: z.string().trim().max(255, "Too long"),
  categoryId: z.string(),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

const orNull = (s: string) => (s.trim() ? s.trim() : null);

export function ProductForm({
  product,
  onSaved,
}: {
  product?: AdminProduct; // missing = creating a new product
  onSaved?: (p: AdminProduct) => void;
}) {
  const { token } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      originInfo: product?.originInfo ?? "",
      roastInfo: product?.roastInfo ?? "",
      categoryId: product?.category?.id ?? "",
      isActive: product?.isActive ?? true,
    },
  });

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  async function onSubmit(v: Values) {
    if (!token) return;
    setFormError(null);
    setSaved(false);
    const body: ProductInput = {
      name: v.name,
      description: orNull(v.description),
      originInfo: orNull(v.originInfo),
      roastInfo: orNull(v.roastInfo),
      categoryId: v.categoryId || null,
      isActive: v.isActive,
      ...(v.slug ? { slug: v.slug } : {}),
    };
    try {
      if (product) {
        const res = await updateAdminProduct(token, product.id, body);
        setSaved(true);
        onSaved?.(res.data);
      } else {
        const res = await createAdminProduct(token, body);
        // Variants (sizes and prices) and the photo are added on the next screen.
        router.push(`/admin/products/${res.data.id}`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("slug", { message: err.message });
      } else if (err instanceof ApiError && Array.isArray(err.details)) {
        let shown = false;
        for (const d of err.details as { field?: unknown; message?: unknown }[]) {
          if (typeof d.field === "string" && typeof d.message === "string" && d.field in schema.shape) {
            setError(d.field as keyof Values, { message: d.message });
            shown = true;
          }
        }
        if (!shown) setFormError(err.message);
      } else {
        setFormError(err instanceof ApiError ? err.message : "Could not save the product.");
      }
    }
  }

  const area =
    "min-h-28 w-full rounded-2xl border-2 border-sand-dark bg-cream px-5 py-3 text-forest placeholder:text-brown/50";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <ErrorNote message={formError} />

      <TextField label="Name" error={errors.name?.message} {...register("name")} />
      <TextField
        label="Slug (the address of the page)"
        hint="Leave empty to create it from the name."
        error={errors.slug?.message}
        {...register("slug")}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-semibold text-forest">
          Description
        </label>
        <textarea id="description" className={area} {...register("description")} />
        {errors.description && <p role="alert" className="text-sm text-terracotta">{errors.description.message}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Origin" error={errors.originInfo?.message} {...register("originInfo")} />
        <TextField label="Roast" error={errors.roastInfo?.message} {...register("roastInfo")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-semibold text-forest">
          Category
        </label>
        <select
          id="categoryId"
          className="h-12 rounded-full border-2 border-sand-dark bg-cream px-5 text-forest"
          {...register("categoryId")}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-forest">
        <input type="checkbox" className="h-5 w-5 accent-[#1f3b2d]" {...register("isActive")} />
        Visible in the shop
      </label>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={isSubmitting} className={btnPrimary}>
          {isSubmitting ? "Saving..." : product ? "Save changes" : "Create product"}
        </button>
        {saved && (
          <span role="status" className="text-sm font-medium text-forest-light">
            Saved.
          </span>
        )}
      </div>
    </form>
  );
}
