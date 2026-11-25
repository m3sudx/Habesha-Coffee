import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import apiRouter from "./router/index.js";
import notFound from "./middleware/notFound.js";
import { env } from "./config/env.js";
import { stripeWebhookHandler } from "./modules/payment/webhook.controller.js";
import { UPLOADS_DIR } from "./config/uploads.js";
import { apiLimiter } from "./middleware/rateLimit.js";

const app = express();

app.use(cors({ origin: env.CLIENT_URL }));

app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    maxAge: "7d",
    immutable: true, // file names are unique (uuid), so a cached file never changes
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  }),
);

// Stripe webhook: needs the RAW body, so it comes before express.json().
// It is also above the rate limiter on purpose, so Stripe is never blocked.
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Working..." });
});

app.use("/api", apiLimiter); // global limit for everything under /api
app.use("/api", apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;