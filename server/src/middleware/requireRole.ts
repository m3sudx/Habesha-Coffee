import type { RequestHandler } from "express";
import { AppError } from "../utils/error.js";

type Role = NonNullable<Express.Request["user"]>["role"];

// Must run AFTER requireAuth, which sets req.user.
// Usage: router.use(requireAuth, requireRole("admin"))
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError("You do not have permission to do this", 403);
    }
    next();
  };
    