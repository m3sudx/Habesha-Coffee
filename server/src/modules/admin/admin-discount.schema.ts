import { z } from "zod";

// Codes are stored in uppercase, so "launch15" and "LAUNCH15" are the same code.
const code = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, "Code must be at least 3 characters")
  .max(50, "Code is too long")
  .regex(/^[A-Z0-9_-]+$/, "Code can only contain letters, numbers, hyphens and underscores");

const type = z.enum(["percent", "fixed"]);

// percent: 1 to 100. fixed: an amount in cents. (The 100 limit for percent is checked below.)
const value = z.number().int("Value must be a whole number").min(1).max(10_000_000);

// null means "no expiry" / "no limit".
const expiresAt = z
  .string()
  .datetime({ offset: true, message: "Use an ISO date, for example 2026-12-31T23:59:59Z" })
  .nullable();
const usageLimit = z.number().int().min(1).max(1_000_000).nullable();

const percentInRange = (v: { type?: "percent" | "fixed"; value?: number }) =>
  !(v.type === "percent" && v.value !== undefined && v.value > 100);

const PERCENT_MESSAGE = "A percent discount must be between 1 and 100";

export const createDiscountSchema = z
  .object({
    code,
    type,
    value,
    expiresAt: expiresAt.optional(),
    usageLimit: usageLimit.optional(),
    isActive: z.boolean().default(true),
  })
  .refine(percentInRange, { message: PERCENT_MESSAGE, path: ["value"] })
  .refine((v) => !v.expiresAt || new Date(v.expiresAt) > new Date(), {
    message: "The expiry date must be in the future",
    path: ["expiresAt"],
  });
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;

// The code itself can't be changed. Every other field is optional, but at least one is required.
export const updateDiscountSchema = z
  .object({
    type: type.optional(),
    value: value.optional(),
    expiresAt: expiresAt.optional(),
    usageLimit: usageLimit.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Send at least one field to update",
  })
  // Changing only the type would silently turn "15%" into "15 cents" (or the reverse).
  .refine((v) => v.type === undefined || v.value !== undefined, {
    message: "Send the value together with the type",
    path: ["value"],
  })
  .refine(percentInRange, { message: PERCENT_MESSAGE, path: ["value"] });
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;

export const DISCOUNT_STATUSES = ["active", "inactive", "expired", "used_up"] as const;

export const adminDiscountListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(50).optional(),
  status: z.enum(DISCOUNT_STATUSES).optional(),
});
export type AdminDiscountListQuery = z.infer<typeof adminDiscountListQuerySchema>;

export const discountIdParamsSchema = z.object({
  id: z.string().uuid("Invalid discount id"),
});
export type DiscountIdParams = z.infer<typeof discountIdParamsSchema>;