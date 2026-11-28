import { api } from "./client";

export type ShippingInput = {
  name: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
};

export type CheckoutResult = { orderId: string; checkoutUrl: string };

// Creates a pending order and a Stripe Checkout session. The browser then goes to checkoutUrl.
export const createCheckout = (token: string, shipping: ShippingInput, discountCode?: string) =>
  api<CheckoutResult>("/orders/checkout", {
    method: "POST",
    token,
    body: { shipping, ...(discountCode ? { discountCode } : {}) },
    cache: "no-store",
  });
