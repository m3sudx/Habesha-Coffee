import { stripe } from '../services/stripe.service.js';
import { markOrderPaid, cancelOrder } from '../services/order.service.js';
import ApiError from '../utils/ApiError.js';

export const stripeWebhook = async (req, res) => {
  // req.body is the RAW body here (a Buffer). The signature check needs it untouched.
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      if (session.payment_status === 'paid') await markOrderPaid(session);
      break;
    case 'checkout.session.expired':
      await cancelOrder(session);
      break;
    // every other event type is ignored
  }

  res.status(200).json({ received: true });
};