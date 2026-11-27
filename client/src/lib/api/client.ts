// The one place that talks to the backend. Pages and hooks call api(...), never fetch(...) directly.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5005/api").replace(
  /\/$/,
  "",
);
// Server root, used for the /health check (it lives outside /api).
export const API_ORIGIN = new URL(API_URL).origin;

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Every successful backend response looks like this: { success: true, data, pagination? }
export type ApiEnvelope<T> = {
  success: true;
  data: T;
  pagination?: Pagination;
  message?: string;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown; // sent as JSON
  token?: string | null; // adds Authorization: Bearer <token>
  cartSession?: string | null; // adds X-Cart-Session for the guest cart
  headers?: Record<string, string>;
};

export async function api<T>(
  path: string,
  { body, token, cartSession, headers, ...init }: ApiOptions = {},
): Promise<ApiEnvelope<T>> {
  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (cartSession) finalHeaders["X-Cart-Session"] = cartSession;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network down, server stopped, or blocked by CORS.
    throw new ApiError("Cannot reach the server. Please try again.", 0);
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.message ?? "Something went wrong. Please try again.",
      res.status,
      json?.errors ?? json?.details,
    );
  }

  return json as ApiEnvelope<T>;
}