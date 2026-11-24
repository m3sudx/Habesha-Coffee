import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import {
  checkoutSchema,
  orderIdParamsSchema,
  orderListQuerySchema,
} from "./order.schema.js";
import {
  checkoutHandler,
  getOrderHandler,
  listOrdersHandler,
} from "./order.controller.js";

const router = Router();

// Every order route needs a logged-in user.
// Guests can shop, but must be logged in to place an order.
router.post("/checkout", requireAuth, validate(checkoutSchema), checkoutHandler);
router.get("/", requireAuth, validate(orderListQuerySchema, "query"), listOrdersHandler);
router.get("/:id", requireAuth, validate(orderIdParamsSchema, "params"), getOrderHandler);

export default router;