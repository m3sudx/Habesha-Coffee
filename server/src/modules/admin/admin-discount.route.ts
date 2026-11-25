import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import {
  adminDiscountListQuerySchema,
  createDiscountSchema,
  discountIdParamsSchema,
  updateDiscountSchema,
} from "./admin-discount.schema.js";
import {
  createDiscountHandler,
  getDiscountHandler,
  listDiscountsHandler,
  updateDiscountHandler,
} from "./admin-discount.controller.js";

const router = Router();

// Every route in this file is admin only: no token gives 401, a customer gives 403.
router.use(requireAuth, requireRole("admin"));

router.get("/", validate(adminDiscountListQuerySchema, "query"), listDiscountsHandler);
router.post("/", validate(createDiscountSchema), createDiscountHandler);
router.get("/:id", validate(discountIdParamsSchema, "params"), getDiscountHandler);
router.patch(
  "/:id",
  validate(discountIdParamsSchema, "params"),
  validate(updateDiscountSchema),
  updateDiscountHandler,
);

export default router;