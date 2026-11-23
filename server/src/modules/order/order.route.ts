import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import { checkoutSchema } from "./order.schema.js";
import { checkoutHandler } from "./order.controller.js";

const router = Router();

// Guests can shop, but must be logged in to place an order.
router.post("/checkout", requireAuth, validate(checkoutSchema), checkoutHandler);

export default router;