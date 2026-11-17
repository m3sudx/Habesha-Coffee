import { z } from "zod";

export const productQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    q: z.string().trim().max(100).optional(),
    category: z.string().trim().toLowerCase().max(255).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    sort: z.enum(["newest", "name", "price_asc", "price_desc"]).default("newest"),
  })
  .refine(
    (v) =>
      v.minPrice === undefined ||
      v.maxPrice === undefined ||
      v.minPrice <= v.maxPrice,
    { message: "minPrice must be less than or equal to maxPrice", path: ["minPrice"] },
  );

export type ProductQuery = z.infer<typeof productQuerySchema>;

export const productSlugParamsSchema = z.object({
  slug: z.string().trim().toLowerCase().min(1).max(255),
});

export type ProductSlugParams = z.infer<typeof productSlugParamsSchema>;