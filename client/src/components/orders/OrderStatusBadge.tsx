import type { OrderStatus } from "@/lib/api/orders";

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Awaiting payment", className: "bg-gold/25 text-brown" },
  paid: { label: "Paid", className: "bg-forest/10 text-forest" },
  shipped: { label: "Shipped", className: "bg-forest text-cream" },
  delivered: { label: "Delivered", className: "bg-forest-light text-cream" },
  cancelled: { label: "Cancelled", className: "bg-terracotta/15 text-terracotta" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STYLES[status] ?? { label: status, className: "bg-sand text-brown" };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}
