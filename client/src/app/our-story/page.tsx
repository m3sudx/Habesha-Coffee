import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/layout/InfoPage";
import { btnPrimary } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Habesha Coffee brings single-origin Ethiopian coffee, roasted fresh, to your door.",
};

export default function OurStoryPage() {
  return (
    <InfoPage
      title="Our Story"
      intro="Ethiopia is where coffee began. We roast it the way it deserves, and send it to you fresh."
    >
      <InfoSection title="Where it begins">
        <p>
          Every bag starts in the Ethiopian highlands: Yirgacheffe, Sidamo, Guji, Harar and Limu.
          Each region gives the bean its own character, from jasmine and citrus to blueberry and
          dried fruit. We choose lots for their flavour and for the farmers who grow them.
        </p>
      </InfoSection>
      <InfoSection title="Roasted in small batches">
        <p>
          We roast in small batches and ship soon after, so your coffee arrives at its best. Light
          roasts keep the bright, floral notes. Medium roasts bring sweetness and body.
        </p>
      </InfoSection>
      <InfoSection title="The coffee ceremony">
        <p>
          In Ethiopia, coffee is a ceremony, shared slowly with family and friends. We hope our
          coffee gives you a reason to slow down and share a cup too.
        </p>
      </InfoSection>
      <div>
        <Link href="/shop" className={btnPrimary}>
          Explore our coffees
        </Link>
      </div>
    </InfoPage>
  );
}
