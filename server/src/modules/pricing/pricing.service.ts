import { pool } from "../../config/db.js";
import { AppError } from "../../utils/error.js";

export type DiscountType = "percent" | "fixed";

export type Discount = {
  id: string;
  code: string;
  type: DiscountType;
  // percent: 1 to 100. fixed: an amount in cents.
  value: number;
};

export type Totals = {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
};

export function calculateDiscountCents(
  discount: Pick<Discount, "type" | "value">,
  subtotalCents: number,
): number {
  const raw =
    discount.type === "percent"
      ? Math.floor((subtotalCents * discount.value) / 100)
      : discount.value;

  return Math.min(raw, subtotalCents);
}

export function calculateTotals(
  subtotalCents: number,
  discount: Pick<Discount, "type" | "value"> | null,
): Totals {
  const discountCents = discount ? calculateDiscountCents(discount, subtotalCents) : 0;

  return {
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
}

export async function findValidDiscount(code: string): Promise<Discount> {
  const { rows } = await pool.query<Discount>(
    `SELECT id, code, type, value
     FROM discount_codes
     WHERE code = $1
       AND is_active = true
       AND (expires_at IS NULL OR expires_at > now())
       AND (usage_limit IS NULL OR times_used < usage_limit)`,
    [code],
  );

  const discount = rows[0];
  if (!discount) {
    throw new AppError("Invalid or expired discount code", 400);
  }
  return discount;
}