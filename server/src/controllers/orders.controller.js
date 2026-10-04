import { checkout,listOrders,getOrder } from '../services/order.service.js';
import { matchedData } from 'express-validator';

export const startCheckout = async (req, res) => {
  const { shipping, discountCode } = req.body;
  const result = await checkout(req.user, shipping, discountCode);
  res.status(201).json({ success: true, ...result });
};

export const listMyOrders = async (req, res) => {
  const { page = 1, limit = 10 } = matchedData(req);
  const result = await listOrders(req.user.id, page, limit);
  res.status(200).json({ success: true, ...result });
};

export const getMyOrder = async (req, res) => {
  const order = await getOrder(req.user.id, req.params.id);
  res.status(200).json({ success: true, order });
};