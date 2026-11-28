// Builds a /shop URL from the current filters plus some changes. Used by both
// server components (pagination) and client components (filters, sort).
// A change to a filter resets the page, unless the change itself sets "page".
export function shopHref(
  current: URLSearchParams,
  changes: Record<string, string | undefined>,
): string {
  const next = new URLSearchParams(current);

  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  if (!("page" in changes)) next.delete("page");

  const qs = next.toString();
  return qs ? `/shop?${qs}` : "/shop";
}
