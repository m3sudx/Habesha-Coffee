import { checkout } from '../services/order.service.js';

export const startCheckout = async (req, res) => {
  const { shipping, discountCode } = req.body;
  const result = await checkout(req.user, shipping, discountCode);
  res.status(201).json({ success: true, ...result });
};