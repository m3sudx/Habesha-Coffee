import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import type { CheckoutInput, OrderIdParams, OrderListQuery } from "./order.schema.js";
import { createCheckout } from "./order.service.js";
import { getOrder, listOrders } from "./order.history.service.js";

export const checkoutHandler: RequestHandler = async (req, res) => {
  const input = getValidated<CheckoutInput>(res);
  // requireAuth runs before this, so req.user is always set.
  const result = await createCheckout(req.user!, input);

  res.status(201).json({ success: true, data: result });
};

export const listOrdersHandler: RequestHandler = async (req, res) => {
  const query = getValidated<OrderListQuery>(res, "query");
  const { items, pagination } = await listOrders(req.user!.id, query);

  res.status(200).json({ success: true, data: items, pagination });
};

export const getOrderHandler: RequestHandler = async (req, res) => {
  const { id } = getValidated<OrderIdParams>(res, "params");
  const order = await getOrder(req.user!.id, id);

  res.status(200).json({ success: true, data: order });
};