import type { Request, RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import { AppError } from "../../utils/error.js";
import {
  sessionIdSchema,
  type AddItemInput,
  type UpdateItemInput,
  type VariantParams,
} from "./cart.schema.js";
import {
  addItem,
  getCart,
  mergeGuestCart,
  removeItem,
  setItemQuantity,
  type CartOwner,
} from "./cart.service.js";

function readSessionId(req: Request): string | null {
  const parsed = sessionIdSchema.safeParse(req.get("x-cart-session"));
  return parsed.success ? parsed.data : null;
}

// Logged-in users use their own cart; guests need the X-Cart-Session header.
function getOwner(req: Request): CartOwner {
  if (req.user) {
    return { userId: req.user.id };
  }

  const sessionId = readSessionId(req);
  if (!sessionId) {
    throw new AppError("A valid X-Cart-Session header is required for guests", 400);
  }
  return { sessionId };
}

export const getCartHandler: RequestHandler = async (req, res) => {
  const cart = await getCart(getOwner(req));

  res.status(200).json({ success: true, data: cart });
};

export const addItemHandler: RequestHandler = async (req, res) => {
  const { variantId, quantity } = getValidated<AddItemInput>(res);
  const cart = await addItem(getOwner(req), variantId, quantity);

  res.status(200).json({ success: true, data: cart });
};

export const updateItemHandler: RequestHandler = async (req, res) => {
  const { variantId } = getValidated<VariantParams>(res, "params");
  const { quantity } = getValidated<UpdateItemInput>(res);
  const cart = await setItemQuantity(getOwner(req), variantId, quantity);

  res.status(200).json({ success: true, data: cart });
};

export const removeItemHandler: RequestHandler = async (req, res) => {
  const { variantId } = getValidated<VariantParams>(res, "params");
  const cart = await removeItem(getOwner(req), variantId);

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