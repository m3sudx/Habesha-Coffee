import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Highlands } from "@/components/home/Highlands";
import { Testimonials } from "@/components/home/Testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <Highlands />
      <Testimonials />
    </>
  );
}
