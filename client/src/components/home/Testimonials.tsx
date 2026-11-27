import { Star } from "lucide-react";

// Sample reviews for the demo store.
const REVIEWS = [
  {
    quote: "The best Ethiopian coffee I have ever had. Rich flavor and excellent quality.",
    name: "Selam T.",
  },
  { quote: "Fast delivery and amazing taste. Highly recommended!", name: "Daniel K." },
  { quote: "A true taste of Ethiopia. Will order again!", name: "Mahlet A." },
];

export function Testimonials() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
          <span className="h-px w-8 bg-terracotta" aria-hidden="true" />
          Testimonials
          <span className="h-px w-8 bg-terracotta" aria-hidden="true" />
        </p>
        <h2 className="mt-3 text-3xl font-medium sm:text-4xl">Loved by Coffee Enthusiasts</h2>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {REVIEWS.map((review) => (
          <figure
            key={review.name}
            className="flex flex-col gap-4 rounded-2xl border border-sand-dark bg-cream p-6 shadow-sm"
          >
            <div className="flex gap-1 text-gold" role="img" aria-label="5 out of 5 stars">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={18} fill="currentColor" aria-hidden="true" />
              ))}
            </div>
            <blockquote className="flex-1 text-base">&ldquo;{review.quote}&rdquo;</blockquote>
            <figcaption className="text-sm font-semibold text-forest">{review.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
