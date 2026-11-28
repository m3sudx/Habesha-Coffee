import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using the Habesha Coffee demo store.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of service"
      intro="Habesha Coffee is a demo store built as a portfolio project. No real goods are sold or shipped."
    >
      <InfoSection title="Test payments">
        <p>Payments run in Stripe test mode. Please use Stripe test cards only, never a real card.</p>
      </InfoSection>
      <InfoSection title="Your account">
        <p>Keep your password private. You are responsible for activity on your account.</p>
      </InfoSection>
      <InfoSection title="Changes">
        <p>Prices, products and these terms can change at any time.</p>
      </InfoSection>
    </InfoPage>
  );
}
