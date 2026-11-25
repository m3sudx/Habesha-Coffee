import { z } from "zod";

export const checkoutSchema = z.object({
  shipping: z.object({
    name: z.string().trim().min(1, "Name is required").max(255),
    phone: z.string().trim().min(5, "Phone number is required").max(50),
    street: z.string().trim().min(1, "Street is required").max(255),
    city: z.string().trim().min(1, "City is required").max(255),
    state: z.string().trim().max(255).optional(),
    zip: z.string().trim().max(50).optional(),
    country: z.string().trim().min(1, "Country is required").max(100),
  }),
  // Same normalization as /discounts/validate: codes are stored in uppercase.
  discountCode: z.string().trim().toUpperCase().max(50).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Query-string values arrive as strings, so numbers use z.coerce.
export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export const orderIdParamsSchema = z.object({
  id: z.string().uuid("Invalid order id"),
});

export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;