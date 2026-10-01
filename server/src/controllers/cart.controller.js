import { getCart } from '../services/cart.service.js';
import { addToCart,updateItemQuantity,removeItem,emptyCart,mergeGuestCart } from '../services/cart.service.js';

export const cart = async (req, res) => {
  res.status(200).json({ success: true, cart: await getCart(req.cartOwner) });
};

export const addItem = async (req, res) => {
  const { variantId, quantity } = req.body;
  await addToCart(req.cartOwner, variantId, quantity);
  res.status(201).json({ success: true, cart: await getCart(req.cartOwner) });
};

export const updateItem = async (req, res) => {
  await updateItemQuantity(req.cartOwner, req.params.itemId, req.body.quantity);
  res.status(200).json({ success: true, cart: await getCart(req.cartOwner) });
};

export const deleteItem = async (req, res) => {
  await removeItem(req.cartOwner, req.params.itemId);
  res.status(200).json({ success: true, cart: await getCart(req.cartOwner) });
};

export const clearCart = async (req, res) => {
  await emptyCart(req.cartOwner);
  res.status(204).end();
};

export const mergeCart = async (req, res) => {
  await mergeGuestCart(req.user.id, req.headers['x-cart-session']);
  const cart = await getCart({ userId: req.user.id, sessionId: null });
  res.status(200).json({ success: true, cart });
};