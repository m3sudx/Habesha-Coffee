import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import { AppError } from "../../utils/error.js";
import { getCartOwner, readSessionId } from "./cart.owner.js";
import type {
  AddItemInput,
  UpdateItemInput,
  VariantParams,
} from "./cart.schema.js";
import {
  addItem,
  getCart,
  mergeGuestCart,
  removeItem,
  setItemQuantity,
} from "./cart.service.js";

export const getCartHandler: RequestHandler = async (req, res) => {
  const cart = await getCart(getCartOwner(req));

  res.status(200).json({ success: true, data: cart });
};

export const addItemHandler: RequestHandler = async (req, res) => {
  const { variantId, quantity } = getValidated<AddItemInput>(res);
  const cart = await addItem(getCartOwner(req), variantId, quantity);

  res.status(200).json({ success: true, data: cart });
};

export const updateItemHandler: RequestHandler = async (req, res) => {
  const { variantId } = getValidated<VariantParams>(res, "params");
  const { quantity } = getValidated<UpdateItemInput>(res);
  const cart = await setItemQuantity(getCartOwner(req), variantId, quantity);

  res.status(200).json({ success: true, data: cart });
};

export const removeItemHandler: RequestHandler = async (req, res) => {
  const { variantId } = getValidated<VariantParams>(res, "params");
  const cart = await removeItem(getCartOwner(req), variantId);

  res.status(200).json({ success: true, data: cart });
};

// Runs after login (requireAuth). The guest cart id comes from the X-Cart-Session header.
export const mergeCartHandler: RequestHandler = async (req, res) => {
  const sessionId = readSessionId(req);
  if (!sessionId) {
    throw new AppError("A valid X-Cart-Session header is required", 400);
  }

  const cart = await mergeGuestCart(req.user!.id, sessionId);

  res.status(200).json({ success: true, data: cart });
};