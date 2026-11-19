import { AppError } from "../../utils/error.js";
import { getCart, type CartOwner } from "../cart/cart.service.js";
import { calculateTotals, findValidDiscount } from "../pricing/pricing.service.js";

export async function previewDiscount(owner: CartOwner, code: string) {
  // The subtotal always comes from the server's cart, never from the client.
  const cart = await getCart(owner);
  if (cart.subtotalCents === 0) {
    throw new AppError("Your cart has no available items", 400);
  }

  const discount = await findValidDiscount(code);
  const totals = calculateTotals(cart.subtotalCents, discount);

  return {
    code: discount.code,
    type: discount.type,
    value: discount.value,
    ...totals,
  };
}