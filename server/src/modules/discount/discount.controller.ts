import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import { getCartOwner } from "../cart/cart.owner.js";
import type { ValidateDiscountInput } from "./discount.schema.js";
import { previewDiscount } from "./discount.service.js";

export const validateDiscountHandler: RequestHandler = async (req, res) => {
  const { code } = getValidated<ValidateDiscountInput>(res);
  const result = await previewDiscount(getCartOwner(req), code);

  res.status(200).json({ success: true, data: result });
};