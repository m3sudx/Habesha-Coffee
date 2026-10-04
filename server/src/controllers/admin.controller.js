import { matchedData } from 'express-validator';
import { adminListOrders, adminGetOrder, updateOrderStatus } from '../services/admin.service.js';

export const listAllOrders = async (req, res) => {
  const { status, search, page = 1, limit = 20 } = matchedData(req);
  const result = await adminListOrders({ status: status ?? null, search: search || null, page, limit });
  res.status(200).json({ success: true, ...result });
};

export const getAnyOrder = async (req, res) => {
  const order = await adminGetOrder(req.params.id);
  res.status(200).json({ success: true, order });
};

export const changeOrderStatus = async (req, res) => {
  const order = await updateOrderStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, order });
};