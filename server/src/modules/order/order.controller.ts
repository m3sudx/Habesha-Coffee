import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import type { CheckoutInput } from "./order.schema.js";
import { createCheckout } from "./order.service.js";

export const checkoutHandler: RequestHandler = async (req, res) => {
  const input = getValidated<CheckoutInput>(res);
  // requireAuth runs before this, so req.user is always set.
  const result = await createCheckout(req.user!, input);

  res.status(201).json({ success: true, data: result });
};