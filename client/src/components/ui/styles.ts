// Shared button looks. Use them on <Link> and <button>: className={btnPrimary}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export const btnPrimary = `${base} bg-forest text-cream hover:bg-forest-light`;
export const btnOutline = `${base} border-2 border-forest text-forest hover:bg-forest hover:text-cream`;
