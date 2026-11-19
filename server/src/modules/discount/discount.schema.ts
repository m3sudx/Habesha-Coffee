import { z } from "zod";

// Codes are stored in uppercase, so "welcome10" and "WELCOME10" are the same code.
export const validateDiscountSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Discount code is required").max(50),
});

export type ValidateDiscountInput = z.infer<typeof validateDiscountSchema>;

