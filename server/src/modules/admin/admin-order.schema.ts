import { z } from "zod";

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Query-string values arrive as strings, so numbers use z.coerce.
export const adminOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});

export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;

// Admins can only move an order forward. Cancelling a paid order needs a refund,
// so it is not allowed here.
export const updateOrderStatusSchema = z.object({
  status: z.enum(["shipped", "delivered"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;