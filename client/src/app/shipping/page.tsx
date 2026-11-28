import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Shipping Info",
  description: "How and when your Habesha Coffee order is shipped.",
};

export default function ShippingPage() {
  return (
    <InfoPage title="Shipping info">
      <InfoSection title="Processing">
        <p>
          Once your payment is confirmed, we roast and pack your order. You can follow its status
          in My Orders: <strong>paid</strong>, then <strong>shipped</strong>, then{" "}
          <strong>delivered</strong>.
        </p>
      </InfoSection>
      <InfoSection title="Address">
        <p>
          You enter your shipping address at checkout. Please check it carefully, because we ship
          to exactly what you enter.
        </p>
      </InfoSection>
      <InfoSection title="Delivery times">
        <p>Delivery times depend on your location. This is a demo store, so no real parcels are sent.</p>
      </InfoSection>
    </InfoPage>
  );
}
