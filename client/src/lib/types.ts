// Shapes returned by the backend catalog endpoints.

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  originInfo: string | null;
  roastInfo: string | null;
  imageUrl: string | null; // relative, like /uploads/abc.jpg
  category: { name: string | null; slug: string } | null;
  priceFromCents: number;
  inStock: boolean;
};

export type Variant = {
  id: string;
  sku: string;
  sizeGrams: number;
  grind: string;
  priceCents: number;
  inStock: boolean;
};

export type ProductDetail = ProductSummary & {
  variants: Variant[];
};

export type ProductSort = "newest" | "name" | "price_asc" | "price_desc";
export const PRODUCT_SORTS: ProductSort[] = ["newest", "name", "price_asc", "price_desc"];
