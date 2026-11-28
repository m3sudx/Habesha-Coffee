import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: "What happens if something is wrong with your order.",
};

export default function ReturnsPage() {
  return (
    <InfoPage title="Returns & refunds">
      <InfoSection title="If an item sells out">
        <p>
          If an item runs out of stock in the moment between your payment and our confirmation, the
          order is cancelled and your payment is refunded automatically.
        </p>
      </InfoSection>
      <InfoSection title="If something is wrong">
        <p>
          Damaged, wrong or unsatisfactory coffee? Contact us with your order reference and we will
          make it right.
        </p>
      </InfoSection>
      <InfoSection title="Roasted coffee">
        <p>
          For hygiene and freshness, opened bags of coffee cannot be returned, but we always want
          you to be happy with what you receive.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
