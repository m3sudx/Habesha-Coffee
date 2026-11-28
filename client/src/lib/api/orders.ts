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

// ---- My orders ----

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
};

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  discountCode: string | null;
  shipping: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string | null;
    zip: string | null;
    country: string;
  };
  items: {
    id: string;
    variantId: string | null;
    productName: string;
    variantLabel: string; // for example "250g, whole_bean"
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }[];
  createdAt: string;
  paidAt: string | null;
};

// Unpaid (pending) attempts are not in the list, but a pending order can still be opened by its id.
export const listMyOrders = (token: string, page: number, limit = 10) =>
  api<OrderSummary[]>(`/orders?page=${page}&limit=${limit}`, { token, cache: "no-store" });

export const getMyOrder = (token: string, id: string) =>
  api<OrderDetail>(`/orders/${id}`, { token, cache: "no-store" });
