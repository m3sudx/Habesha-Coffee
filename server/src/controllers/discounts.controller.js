import { getCart } from '../services/cart.service.js';
import { findValidDiscount, priceOrder } from '../services/pricing.service.js';
import ApiError from '../utils/ApiError.js';

export const validateDiscount = async (req, res) => {
  const cart = await getCart(req.cartOwner);
  if (cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

  const discount = await findValidDiscount(req.body.code, cart.subtotalCents);
  const prices = priceOrder(cart.subtotalCents, discount);

  res.status(200).json({
    success: true,
    valid: true,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    ...prices,
  });
};