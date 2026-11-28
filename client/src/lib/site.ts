// The public address of the website, used for the sitemap and share links.
// Set NEXT_PUBLIC_SITE_URL in production (for example https://habesha-coffee.vercel.app).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
