import Stripe from "stripe";
import { env } from "./env.js";

// One shared client. The SDK uses the API version it was built for.
export const stripe = new Stripe(env.STRIPE_SECRET_KEY);