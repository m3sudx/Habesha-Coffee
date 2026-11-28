import { api } from "./client";

export type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  sku: string;
  sizeGrams: number;
  grind: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  maxQuantity: number; // current stock
  available: boolean; // can be bought right now in this quantity
};

export type Cart = {
  id: string | null;
  items: CartItem[];
  itemCount: number;
  subtotalCents: number; // only counts items that are available
};

export type DiscountPreview = {
  code: string;
  type: "percent" | "fixed";
  value: number; // percent: 1 to 100. fixed: cents.
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
};

// Logged-in users are identified by their token, guests by their cart session id.
export type CartIdentity = { token: string | null; sessionId: string | null };

function options(id: CartIdentity) {
  return {
    token: id.token,
    cartSession: id.token ? null : id.sessionId,
    cache: "no-store" as const,
  };
}

export const getCart = (id: CartIdentity) => api<Cart>("/cart", options(id));

export const addItem = (id: CartIdentity, variantId: string, quantity: number) =>
  api<Cart>("/cart/items", { ...options(id), method: "POST", body: { variantId, quantity } });

export const setItemQuantity = (id: CartIdentity, variantId: string, quantity: number) =>
  api<Cart>(`/cart/items/${variantId}`, { ...options(id), method: "PATCH", body: { quantity } });

export const removeItem = (id: CartIdentity, variantId: string) =>
  api<Cart>(`/cart/items/${variantId}`, { ...options(id), method: "DELETE" });

// After login: moves the guest cart into the account cart.
export const mergeCart = (token: string, sessionId: string) =>
  api<Cart>("/cart/merge", { method: "POST", token, cartSession: sessionId, cache: "no-store" });

export const validateDiscount = (id: CartIdentity, code: string) =>
  api<DiscountPreview>("/discounts/validate", { ...options(id), method: "POST", body: { code } });
