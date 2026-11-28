import { z } from "zod";

// Mirrors the backend rules (order.schema.ts). The backend checks everything again.
export const shippingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  phone: z.string().trim().min(5, "Phone number is required").max(50, "Phone number is too long"),
  street: z.string().trim().min(1, "Street is required").max(255, "Street is too long"),
  city: z.string().trim().min(1, "City is required").max(255, "City is too long"),
  state: z.string().trim().max(255, "Too long"),
  zip: z.string().trim().max(50, "Too long"),
  country: z.string().trim().min(1, "Country is required").max(100, "Country is too long"),
});
export type ShippingValues = z.infer<typeof shippingSchema>;
