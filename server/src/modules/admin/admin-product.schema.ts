import { z } from "zod";

// ---------- Products ----------

const name = z.string().trim().min(1, "Name is required").max(255);
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers and hyphens");
const description = z.string().trim().max(5000).nullable();
const shortText = z.string().trim().max(255).nullable();
// Plain text for now; the image upload branch will fill this in automatically.
const imageUrl = z.string().trim().max(2000).nullable();
const categoryId = z.string().uuid("Invalid category id").nullable();

export const createProductSchema = z.object({
  name,
  slug: slug.optional(), // generated from the name when missing
  description: description.optional(),
  originInfo: shortText.optional(),
  roastInfo: shortText.optional(),
  imageUrl: imageUrl.optional(),
  categoryId: categoryId.optional(),
  isActive: z.boolean().default(true),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

// Every field is optional, but at least one must be sent.
export const updateProductSchema = z
  .object({
    name: name.optional(),
    slug: slug.optional(),
    description: description.optional(),
    originInfo: shortText.optional(),
    roastInfo: shortText.optional(),
    imageUrl: imageUrl.optional(),
    categoryId: categoryId.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Send at least one field to update",
  });
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const adminProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().toLowerCase().max(255).optional(),
  // Query-string values are text, so "true" / "false" are converted here.
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;

export const productIdParamsSchema = z.object({
  id: z.string().uuid("Invalid product id"),
});
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;

// ---------- Variants ----------

const sku = z
  .string()
  .trim()
  .toUpperCase()
  .min(1)
  .max(100)
  .regex(/^[A-Z0-9-]+$/, "SKU can only contain letters, numbers and hyphens");
const sizeGrams = z.number().int().min(1).max(100_000);
const grind = z.string().trim().min(1).max(100);
// Prices are integer cents, like everywhere else in the project.
const priceCents = z.number().int().min(0).max(10_000_000);
const stock = z.number().int().min(0).max(1_000_000);

export const createVariantSchema = z.object({
  sku,
  sizeGrams,
  grind: grind.default("whole bean"),
  priceCents,
  stock: stock.default(0),
  isActive: z.boolean().default(true),
});
export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const updateVariantSchema = z
  .object({
    sku: sku.optional(),
    sizeGrams: sizeGrams.optional(),
    grind: grind.optional(),
    priceCents: priceCents.optional(),
    stock: stock.optional(), // sets the exact stock level
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Send at least one field to update",
  });
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

export const productVariantParamsSchema = z.object({
  id: z.string().uuid("Invalid product id"),
  variantId: z.string().uuid("Invalid variant id"),
});
export type ProductVariantParams = z.infer<typeof productVariantParamsSchema>;