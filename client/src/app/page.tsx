import { ApiStatus } from "@/components/dev/ApiStatus";

// Temporary page for F0. It is replaced by the real Home page in F1.
export default function HomePage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-forest-light">
        From the birthplace of coffee
      </p>
      <h1 className="mt-4 max-w-2xl text-5xl font-medium leading-tight">
        A Taste of Ethiopia in Every Cup.
      </h1>
      <p className="mt-4 max-w-xl text-lg">
        Setup check: theme, fonts, layout and the API connection.
      </p>
      <div className="mt-8">
        <ApiStatus />
      </div>
    </section>
  );
}