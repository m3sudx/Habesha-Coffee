import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about an order or a coffee? Get in touch with Habesha Coffee.",
};

const ITEMS = [
  { icon: Mail, label: "Email", value: "hello@habesha-coffee.example" },
  { icon: Phone, label: "Phone", value: "+251 11 000 0000" },
  { icon: MapPin, label: "Roastery", value: "Addis Ababa, Ethiopia" },
  { icon: Clock, label: "Hours", value: "Mon to Fri, 9:00 to 17:00 (EAT)" },
];

export default function ContactPage() {
  return (
    <InfoPage title="Contact us" intro="Questions about an order or a coffee? We are happy to help.">
      <ul className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-start gap-4 rounded-2xl border border-sand-dark bg-cream p-5">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-sand text-forest">
              <Icon size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brown">{label}</p>
              <p className="mt-1 font-medium text-forest">{value}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm">
        Habesha Coffee is a demo store built as a portfolio project. The contact details above are
        placeholders.
      </p>
    </InfoPage>
  );
}
