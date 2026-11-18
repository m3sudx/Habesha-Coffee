import { z } from "zod";

const quantity = z.number().int().min(1).max(99);

export const addItemSchema = z.object({
  variantId: z.string().uuid("Invalid variant id"),
  quantity: quantity.default(1),
});
export type AddItemInput = z.infer<typeof addItemSchema>;

// Sets the quantity to an exact value. To remove an item, use DELETE.
export const updateItemSchema = z.object({
  quantity,
});
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const variantParamsSchema = z.object({
  variantId: z.string().uuid("Invalid variant id"),
});
export type VariantParams = z.infer<typeof variantParamsSchema>;

// The guest cart id the browser keeps in localStorage and sends as X-Cart-Session.
export const sessionIdSchema = z.string().uuid("Invalid cart session id");