import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import {
  addItemSchema,
  updateItemSchema,
  variantParamsSchema,
} from "./cart.schema.js";
import {
  addItemHandler,
  getCartHandler,
  mergeCartHandler,
  removeItemHandler,
  updateItemHandler,
} from "./cart.controller.js";

const router = Router();

// Guests and logged-in users can both use these.
router.get("/", optionalAuth, getCartHandler);
router.post("/items", optionalAuth, validate(addItemSchema), addItemHandler);
router.patch(
  "/items/:variantId",
  optionalAuth,
  validate(variantParamsSchema, "params"),
  validate(updateItemSchema),
  updateItemHandler,
);
router.delete(
  "/items/:variantId",
  optionalAuth,
  validate(variantParamsSchema, "params"),
  removeItemHandler,
);

// Login required: moves the guest cart (X-Cart-Session) into the user's cart.
router.post("/merge", requireAuth, mergeCartHandler);

export default router;