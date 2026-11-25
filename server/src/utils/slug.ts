// "Yirgacheffe Washed (Grade 1)" -> "yirgacheffe-washed-grade-1"
// Returns "" when nothing usable is left (for example a name written only in Amharic),
// so the caller can ask for an explicit slug.
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255);
}