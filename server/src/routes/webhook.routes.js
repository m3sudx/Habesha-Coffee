import express, { Router } from 'express';
import { stripeWebhook } from '../controllers/webhook.controller.js';

const webhookRoute = Router();

// express.raw keeps the body as raw bytes, which Stripe's signature check requires
webhookRoute.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

export default webhookRoute;