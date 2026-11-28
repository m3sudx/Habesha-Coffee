// The shared frame for the plain content pages (Our Story, FAQ, Shipping, and so on).
export function InfoPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-medium sm:text-5xl">{title}</h1>
      {intro && <p className="mt-4 text-lg">{intro}</p>}
      <div className="mt-10 flex flex-col gap-10">{children}</div>
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 leading-relaxed">{children}</div>
    </section>
  );
}
