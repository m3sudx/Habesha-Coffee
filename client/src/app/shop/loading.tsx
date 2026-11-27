// Shown instantly while the Shop page loads its data.
export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6" aria-busy="true">
      <div className="mb-10 h-12 w-40 animate-pulse rounded-full bg-sand" />
      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <div className="hidden h-96 animate-pulse rounded-2xl bg-sand lg:block" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-sand" />
          ))}
        </div>
      </div>
    </div>
  );
}
