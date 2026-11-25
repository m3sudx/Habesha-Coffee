import { Router } from "express";
import { optionalAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import { validateDiscountSchema } from "./discount.schema.js";
import { validateDiscountHandler } from "./discount.controller.js";
import { discountLimiter } from "../../middleware/rateLimit.js";

const router = Router();

// Guests can preview a code on their cart; checkout itself will require login.
router.post("/validate",discountLimiter, optionalAuth, validate(validateDiscountSchema), validateDiscountHandler);

export default router;