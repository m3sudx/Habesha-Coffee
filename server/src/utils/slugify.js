// "Yirgacheffe Natural!" -> "yirgacheffe-natural"
export default function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')                 // split letters from accents: é -> e + accent
    .replace(/[\u0300-\u036f]/g, '')   // remove the accents
    .replace(/[^a-z0-9]+/g, '-')       // anything else becomes a hyphen
    .replace(/^-+|-+$/g, '');          // no hyphen at the start or end
}