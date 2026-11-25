import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import type { OrderIdParams } from "../order/order.schema.js";
import type { AdminOrderListQuery, UpdateOrderStatusInput } from "./admin-order.schema.js";
import {
  getAdminOrder,
  listAdminOrders,
  updateOrderStatus,
} from "./admin-order.service.js";

export const listAdminOrdersHandler: RequestHandler = async (_req, res) => {
  const query = getValidated<AdminOrderListQuery>(res, "query");
  const { items, pagination } = await listAdminOrders(query);

  res.status(200).json({ success: true, data: items, pagination });
};

export const getAdminOrderHandler: RequestHandler = async (_req, res) => {
  const { id } = getValidated<OrderIdParams>(res, "params");
  const order = await getAdminOrder(id);

  res.status(200).json({ success: true, data: order });
};

export const updateOrderStatusHandler: RequestHandler = async (_req, res) => {
  const { id } = getValidated<OrderIdParams>(res, "params");
  const { status } = getValidated<UpdateOrderStatusInput>(res);
  const order = await updateOrderStatus(id, status);

  res.status(200).json({ success: true, data: order });
};