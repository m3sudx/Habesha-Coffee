import type { RequestHandler } from "express";
import type Stripe from "stripe";
import { env } from "../../config/env.js";
import { stripe } from "../../config/stripe.js";
import { AppError } from "../../utils/error.js";
import { handleCheckoutCompleted } from "./payment.service.js";

// This route must receive the RAW body (express.raw), because the signature is
// calculated over the exact bytes Stripe sent. See app.ts.
export const stripeWebhookHandler: RequestHandler = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    throw new AppError("Missing Stripe signature", 400);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError("Invalid webhook signature", 400);
  }

  // Any other event type is acknowledged and ignored.
  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data.object);
  }

  // A thrown error becomes a 500, which makes Stripe retry the event.
  res.status(200).json({ received: true });
};