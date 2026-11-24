import { env } from "../../config/env.js";
import { pool } from "../../config/db.js";
import { transporter } from "../../config/mailer.js";

type OrderEmailRow = {
  id: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  shipping_name: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string | null;
  shipping_zip: string | null;
  shipping_country: string;
  customer_name: string;
  customer_email: string;
};

type OrderItemEmailRow = {
  product_name: string;
  variant_label: string;
  unit_price_cents: number;
  quantity: number;
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// Names and addresses are typed by customers, so they must be escaped before going into HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Sends the "thank you" email for a paid order. It throws on failure: the caller decides
// what to do (the webhook only logs it, so a mail problem never affects the payment).
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  if (!transporter) {
    console.warn("SMTP is not configured: skipping the order confirmation email");
    return;
  }

  const orderResult = await pool.query<OrderEmailRow>(
    `SELECT o.id, o.subtotal_cents, o.discount_cents, o.total_cents,
            o.shipping_name, o.shipping_street, o.shipping_city, o.shipping_state,
            o.shipping_zip, o.shipping_country,
            u.name AS customer_name, u.email AS customer_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [orderId],
  );
  const order = orderResult.rows[0];
  if (!order) {
    // The account was deleted, so there is nobody to email.
    return;
  }

  const itemsResult = await pool.query<OrderItemEmailRow>(
    `SELECT product_name, variant_label, unit_price_cents, quantity
     FROM order_items WHERE order_id = $1 ORDER BY created_at, id`,
    [orderId],
  );

  const orderNumber = `#${order.id.slice(0, 8).toUpperCase()}`;
  const address = [
    order.shipping_name,
    order.shipping_street,
    [order.shipping_city, order.shipping_state, order.shipping_zip].filter(Boolean).join(", "),
    order.shipping_country,
  ];

  const text = [
    `Hi ${order.customer_name},`,
    "",
    `Thank you for your order ${orderNumber}. We have received your payment.`,
    "",
    ...itemsResult.rows.map(
      (i) =>
        `${i.quantity} x ${i.product_name} (${i.variant_label}) - ${money(i.unit_price_cents * i.quantity)}`,
    ),
    "",
    `Subtotal: ${money(order.subtotal_cents)}`,
    ...(order.discount_cents > 0 ? [`Discount: -${money(order.discount_cents)}`] : []),
    `Total: ${money(order.total_cents)}`,
    "",
    "Shipping to:",
    ...address,
    "",
    "Habesha Coffee",
  ].join("\n");

  const itemRows = itemsResult.rows
    .map(
      (i) => `<tr>
        <td style="padding:6px 0">${i.quantity} &times; ${escapeHtml(i.product_name)}
          <span style="color:#777">(${escapeHtml(i.variant_label)})</span></td>
        <td style="padding:6px 0;text-align:right">${money(i.unit_price_cents * i.quantity)}</td>
      </tr>`,
    )
    .join("");

  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#222">
    <h2 style="color:#6b3e1f">Thank you for your order!</h2>
    <p>Hi ${escapeHtml(order.customer_name)}, we have received your payment for order
      <strong>${orderNumber}</strong>.</p>
    <table style="width:100%;border-collapse:collapse">${itemRows}</table>
    <hr style="border:none;border-top:1px solid #ddd">
    <p style="text-align:right;margin:4px 0">Subtotal: ${money(order.subtotal_cents)}</p>
    ${
      order.discount_cents > 0
        ? `<p style="text-align:right;margin:4px 0">Discount: -${money(order.discount_cents)}</p>`
        : ""
    }
    <p style="text-align:right;margin:4px 0"><strong>Total: ${money(order.total_cents)}</strong></p>
    <h3>Shipping to</h3>
    <p>${address.map(escapeHtml).join("<br>")}</p>
    <p style="color:#777">Habesha Coffee</p>
  </div>`;

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: order.customer_email,
    subject: `Your Habesha Coffee order ${orderNumber}`,
    text,
    html,
  });
}