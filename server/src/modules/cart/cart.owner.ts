import type { Request } from "express";
import { AppError } from "../../utils/error.js";
import { sessionIdSchema } from "./cart.schema.js";
import type { CartOwner } from "./cart.service.js";

export function readSessionId(req: Request): string | null {
  const parsed = sessionIdSchema.safeParse(req.get("x-cart-session"));
  return parsed.success ? parsed.data : null;
}

export function getCartOwner(req: Request): CartOwner {
  if (req.user) {
    return { userId: req.user.id };
  }

  const sessionId = readSessionId(req);
  if (!sessionId) {
    throw new AppError("A valid X-Cart-Session header is required for guests", 400);
  }
  return { sessionId };
}