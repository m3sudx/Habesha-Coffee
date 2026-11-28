import { API_URL, ApiError, api, type Pagination } from "./client";
import type { OrderDetail, OrderStatus } from "./orders";

// Every call here needs an admin token. The backend answers 401/403 for anyone else.

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const text = sp.toString();
  return text ? `?${text}` : "";
}

const opts = (token: string) => ({ token, cache: "no-store" as const });

// ---------- Stats ----------

export type Stats = {
  period: { days: number };
  totals: {
    revenueCents: number;
    orders: number;
    unitsSold: number;
    discountCents: number;
    averageOrderCents: number;
  };
  ordersByStatus: Record<OrderStatus, number>;
  customers: { total: number; newInPeriod: number };
  dailySales: { date: string; revenueCents: number; orders: number }[];
  topProducts: { productName: string; unitsSold: number; revenueCents: number }[];
  lowStock: {
    variantId: string;
    productName: string;
    sku: string;
    sizeGrams: number;
    grind: string;
    stock: number;
  }[];
};

export const getStats = (token: string, days: number) =>
  api<Stats>(`/admin/stats/overview${qs({ days })}`, opts(token));

// ---------- Orders ----------

export type AdminOrderSummary = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  itemCount: number;
  shippingCity: string;
  customer: { name: string; email: string } | null;
  createdAt: string;
  paidAt: string | null;
};

export type AdminOrderDetail = OrderDetail & {
  stripeSessionId: string | null;
  customer: { id: string; name: string; email: string } | null;
  updatedAt: string;
};

export const listAdminOrders = (
  token: string,
  p: { page: number; status?: string; q?: string },
) => api<AdminOrderSummary[]>(`/admin/orders${qs({ ...p, limit: 15 })}`, opts(token));

export const getAdminOrder = (token: string, id: string) =>
  api<AdminOrderDetail>(`/admin/orders/${id}`, opts(token));

export const setOrderStatus = (token: string, id: string, status: "shipped" | "delivered") =>
  api<AdminOrderDetail>(`/admin/orders/${id}/status`, {
    ...opts(token),
    method: "PATCH",
    body: { status },
  });

// ---------- Products ----------

export type AdminVariant = {
  id: string;
  sku: string;
  sizeGrams: number;
  grind: string;
  priceCents: number;
  stock: number;
  isActive: boolean;
};

export type AdminProductSummary = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  category: { name: string; slug: string } | null;
  variantCount: number;
  priceFromCents: number | null;
  totalStock: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  originInfo: string | null;
  roastInfo: string | null;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: string; name: string; slug: string } | null;
  variants: AdminVariant[];
};

export type ProductInput = {
  name: string;
  slug?: string;
  description: string | null;
  originInfo: string | null;
  roastInfo: string | null;
  categoryId: string | null;
  isActive: boolean;
};

export type VariantInput = {
  sku: string;
  sizeGrams: number;
  grind: string;
  priceCents: number;
  stock: number;
  isActive: boolean;
};

export const listAdminProducts = (
  token: string,
  p: { page: number; q?: string; isActive?: string },
) => api<AdminProductSummary[]>(`/admin/products${qs({ ...p, limit: 15 })}`, opts(token));

export const getAdminProduct = (token: string, id: string) =>
  api<AdminProduct>(`/admin/products/${id}`, opts(token));

export const createAdminProduct = (token: string, body: ProductInput) =>
  api<AdminProduct>("/admin/products", { ...opts(token), method: "POST", body });

export const updateAdminProduct = (token: string, id: string, body: Partial<ProductInput>) =>
  api<AdminProduct>(`/admin/products/${id}`, { ...opts(token), method: "PATCH", body });

export const createVariant = (token: string, productId: string, body: VariantInput) =>
  api<unknown>(`/admin/products/${productId}/variants`, { ...opts(token), method: "POST", body });

export const updateVariant = (
  token: string,
  productId: string,
  variantId: string,
  body: Partial<Omit<VariantInput, "sku" | "sizeGrams" | "grind">>,
) =>
  api<unknown>(`/admin/products/${productId}/variants/${variantId}`, {
    ...opts(token),
    method: "PATCH",
    body,
  });

// Image upload is multipart (the file goes in the "image" field), so it can't use api().
async function sendImage(token: string, productId: string, file: File, method: "PUT" | "POST") {
  const form = new FormData();
  form.append("image", file);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${productId}/image`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: form,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.", 0);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.message ?? "Upload failed. Please try again.", res.status, json?.errors);
  }
  return json.data as AdminProduct;
}

export async function uploadProductImage(token: string, productId: string, file: File) {
  try {
    return await sendImage(token, productId, file, "PUT");
  } catch (err) {
    // If the route was declared with POST on the server, try that instead.
    if (err instanceof ApiError && err.status === 404) {
      return sendImage(token, productId, file, "POST");
    }
    throw err;
  }
}

export const removeProductImage = (token: string, productId: string) =>
  api<AdminProduct>(`/admin/products/${productId}/image`, { ...opts(token), method: "DELETE" });

// ---------- Discounts ----------

export type DiscountStatus = "active" | "inactive" | "expired" | "used_up";

export type AdminDiscount = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number; // percent: 1 to 100. fixed: cents.
  expiresAt: string | null;
  usageLimit: number | null;
  timesUsed: number;
  isActive: boolean;
  status: DiscountStatus;
};

export type DiscountInput = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  expiresAt: string | null;
  usageLimit: number | null;
  isActive: boolean;
};

export const listAdminDiscounts = (token: string, p: { page: number; status?: string; q?: string }) =>
  api<AdminDiscount[]>(`/admin/discounts${qs({ ...p, limit: 15 })}`, opts(token));

export const createAdminDiscount = (token: string, body: DiscountInput) =>
  api<AdminDiscount>("/admin/discounts", { ...opts(token), method: "POST", body });

export const updateAdminDiscount = (
  token: string,
  id: string,
  body: Partial<Pick<DiscountInput, "isActive" | "usageLimit" | "expiresAt">>,
) => api<AdminDiscount>(`/admin/discounts/${id}`, { ...opts(token), method: "PATCH", body });

export type { Pagination };
