import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import { orderIdParamsSchema } from "../order/order.schema.js";
import { adminOrderListQuerySchema, updateOrderStatusSchema } from "./admin-order.schema.js";
import {
  getAdminOrderHandler,
  listAdminOrdersHandler,
  updateOrderStatusHandler,
} from "./admin-order.controller.js";

const router = Router();

// Every route in this file is admin only: no token gives 401, a customer gives 403.
router.use(requireAuth, requireRole("admin"));

router.get("/", validate(adminOrderListQuerySchema, "query"), listAdminOrdersHandler);
router.get("/:id", validate(orderIdParamsSchema, "params"), getAdminOrderHandler);
router.patch(
  "/:id/status",
  validate(orderIdParamsSchema, "params"),
  validate(updateOrderStatusSchema),
  updateOrderStatusHandler,
);

export default router;