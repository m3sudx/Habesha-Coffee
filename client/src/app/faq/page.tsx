import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about grinds, freshness, ordering and payment.",
};

const FAQ = [
  {
    q: "What is the difference between whole bean and ground?",
    a: "Whole beans stay fresh longer and give the best flavour when you grind them just before brewing. Ground coffee is ready to brew. Choose the grind when you pick your size.",
  },
  {
    q: "How fresh is the coffee?",
    a: "We roast in small batches and ship soon after, so your coffee arrives fresh. For the best taste, drink it within a few weeks of opening.",
  },
  {
    q: "Do I need an account to order?",
    a: "You can browse and fill your cart as a guest. To check out you log in or create an account. Your cart is kept when you do.",
  },
  {
    q: "How do I pay?",
    a: "Payments are handled by Stripe on its own secure page. We never see or store your card details.",
  },
  {
    q: "Can I use a discount code?",
    a: "Yes. Enter it in your cart before checking out. The new total is shown right away.",
  },
  {
    q: "Where can I see my orders?",
    a: "Log in and open My Orders in your account. You will see each order with its status: paid, shipped or delivered.",
  },
];

export default function FaqPage() {
  return (
    <InfoPage title="Frequently asked questions">
      <div className="flex flex-col gap-3">
        {FAQ.map((item) => (
          <details key={item.q} className="group rounded-2xl border border-sand-dark bg-cream p-5">
            <summary className="cursor-pointer list-none text-lg font-semibold text-forest [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span aria-hidden="true" className="text-2xl transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
