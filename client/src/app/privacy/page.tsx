import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information Habesha Coffee keeps and why.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy policy"
      intro="Habesha Coffee is a demo store built as a portfolio project. This page explains how the demo handles data."
    >
      <InfoSection title="What we keep">
        <p>
          Your name, email and a hashed password for your account, your cart, and the shipping
          address and items of your orders.
        </p>
      </InfoSection>
      <InfoSection title="Payments">
        <p>
          Card payments are processed by Stripe. Your card details go to Stripe directly and are
          never stored by us.
        </p>
      </InfoSection>
      <InfoSection title="Cookies and storage">
        <p>
          We store your login and your cart in your browser so that they are still there when you
          come back. We do not use advertising trackers.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
