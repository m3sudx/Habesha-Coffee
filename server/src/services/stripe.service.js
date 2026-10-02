import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const currency = () => (process.env.CURRENCY || 'usd').toLowerCase();

// Creates the Stripe payment page for an order and returns the session
export async function createCheckoutSession({ orderId, items, discountCents, customerEmail }) {
  const params = {
    mode: 'payment',
    customer_email: customerEmail,
    line_items: items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: currency(),
        unit_amount: i.unitPriceCents, // Stripe also wants the smallest unit: cents
        product_data: { name: `${i.productName} - ${i.variantLabel}` },
      },
    })),
    metadata: { orderId: String(orderId) }, // lets the webhook find the order later
    success_url: `${process.env.CLIENT_URL}/checkout/success?order=${orderId}`,
    cancel_url: `${process.env.CLIENT_URL}/cart`,
  };

  // Stripe cannot take negative line items, so a discount is sent as a one-time coupon
  if (discountCents > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: discountCents,
      currency: currency(),
      duration: 'once',
    });
    params.discounts = [{ coupon: coupon.id }];
  }

  return stripe.checkout.sessions.create(params);
}