// "2026-11-28T14:03:00.000Z" -> "Nov 28, 2026"
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// "250g, whole_bean" -> "250 g · Whole bean"
export function formatVariantLabel(label: string): string {
  const [size = "", grind = ""] = label.split(",").map((s) => s.trim());
  const sizeText = size.replace(/^(\d+)\s*g$/i, "$1 g");
  const grindText = grind.replace(/[_-]/g, " ");
  const grindFinal = grindText.charAt(0).toUpperCase() + grindText.slice(1);
  return grind ? `${sizeText} · ${grindFinal}` : sizeText;
}

// A short reference people can quote: the first 8 characters of the id.
export function orderRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
