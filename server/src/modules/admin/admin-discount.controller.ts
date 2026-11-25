import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import type {
  AdminDiscountListQuery,
  CreateDiscountInput,
  DiscountIdParams,
  UpdateDiscountInput,
} from "./admin-discount.schema.js";
import {
  createDiscount,
  getDiscount,
  listDiscounts,
  updateDiscount,
} from "./admin-discount.service.js";

export const listDiscountsHandler: RequestHandler = async (_req, res) => {
  const query = getValidated<AdminDiscountListQuery>(res, "query");
  const { items, pagination } = await listDiscounts(query);

  res.status(200).json({ success: true, data: items, pagination });
};

export const getDiscountHandler: RequestHandler = async (_req, res) => {
  const { id } = getValidated<DiscountIdParams>(res, "params");
  const discount = await getDiscount(id);

  res.status(200).json({ success: true, data: discount });
};

export const createDiscountHandler: RequestHandler = async (_req, res) => {
  const input = getValidated<CreateDiscountInput>(res);
  const discount = await createDiscount(input);

  res.status(201).json({ success: true, data: discount });
};

export const updateDiscountHandler: RequestHandler = async (_req, res) => {
  const { id } = getValidated<DiscountIdParams>(res, "params");
  const input = getValidated<UpdateDiscountInput>(res);
  const discount = await updateDiscount(id, input);

  res.status(200).json({ success: true, data: discount });
};