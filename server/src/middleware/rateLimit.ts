import { rateLimit } from "express-rate-limit";
import { AppError } from "../utils/error.js";

// Builds a limiter. When the limit is hit, the error goes through your normal
// errorHandler, so the response has the same shape as every other error.
function createLimiter(options: {
  windowMs: number;
  limit: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-7", // sends RateLimit-* and Retry-After headers
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    handler: (_req, _res, next) => next(new AppError(options.message, 429)),
  });
}

const MINUTE = 60 * 1000;

// Whole API: generous, only stops scripts hammering the server.
export const apiLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 300,
  message: "Too many requests, please try again later",
});

// Login: only FAILED attempts count, so a real user who logs in fine is never blocked.
export const loginLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many login attempts, please try again in 15 minutes",
});

// Register: stops mass fake accounts.
export const registerLimiter = createLimiter({
  windowMs: 60 * MINUTE,
  limit: 5,
  message: "Too many accounts created from this address, please try again later",
});

// Checkout: each call creates a Stripe session, so keep it tight.
export const checkoutLimiter = createLimiter({
  windowMs: 10 * MINUTE,
  limit: 10,
  message: "Too many checkout attempts, please try again in a few minutes",
});

// Discount validation: stops guessing codes.
export const discountLimiter = createLimiter({
  windowMs: 10 * MINUTE,
  limit: 20,
  message: "Too many attempts, please try again in a few minutes",
});