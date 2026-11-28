import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api/catalog";
import { SITE_URL } from "@/lib/site";

const PAGES = ["", "/shop", "/our-story", "/contact", "/faq", "/shipping", "/returns", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = PAGES.map((path) => ({ url: `${SITE_URL}${path}` }));

  // Every product page. If the API is down while this is generated, the static pages still work.
  try {
    const res = await getProducts({ limit: 50 });
    return [...pages, ...res.data.map((p) => ({ url: `${SITE_URL}/shop/${p.slug}` }))];
  } catch {
    return pages;
  }
}
