import { pool } from "../../config/db.js";
import { AppError } from "../../utils/error.js";
import type { ProductQuery } from "./catalog.schema.js";


const SORT_SQL: Record<ProductQuery["sort"], string> = {
  newest: "p.created_at DESC, p.id",
  name: "p.name ASC, p.id",
  price_asc: "price_from_cents ASC, p.id",
  price_desc: "price_from_cents DESC, p.id",
};

// Escape LIKE wildcards so a search for "100%" doesn't match everything.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  origin_info: string | null;
  roast_info: string | null;
  image_url: string | null;
  category_name: string | null;
  category_slug: string | null;
  price_from_cents: number;
  in_stock: boolean;
};

type VariantRow = {
  id: string;
  sku: string;
  size_grams: number;
  grind: string;
  price_cents: number;
  in_stock: boolean;
};

function toProduct(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    originInfo: row.origin_info,
    roastInfo: row.roast_info,
    imageUrl: row.image_url,
    category: row.category_slug
      ? { name: row.category_name, slug: row.category_slug }
      : null,
    priceFromCents: row.price_from_cents,
    inStock: row.in_stock,
  };
}

export async function listCategories() {
  const { rows } = await pool.query<{ id: string; name: string; slug: string }>(
    "SELECT id, name, slug FROM categories ORDER BY name",
  );
  return rows;
}

export async function listProducts(query: ProductQuery) {
  const { page, limit, q, category, minPrice, maxPrice, sort } = query;

  const conditions: string[] = ["p.is_active = true"];
  const having: string[] = [];
  const params: unknown[] = [];

  // Pushes a value and returns its placeholder ($1, $2, ...), so conditions
  // and parameters are always built together and stay in sync.
  const add = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  if (q) {
    const p = add(`%${escapeLike(q)}%`);
    conditions.push(`(p.name ILIKE ${p} OR p.description ILIKE ${p})`);
  }
  if (category) {
    conditions.push(`c.slug = ${add(category)}`);
  }
  // Price filters apply to the "from" price (cheapest active variant).
  if (minPrice !== undefined) {
    having.push(`MIN(v.price_cents) >= ${add(minPrice)}`);
  }
  if (maxPrice !== undefined) {
    having.push(`MIN(v.price_cents) <= ${add(maxPrice)}`);
  }

  // The JOIN on active variants means products with no active variant are hidden.
  const groupedSql = `
    SELECT p.id, p.name, p.slug, p.description, p.origin_info, p.roast_info,
           p.image_url, p.created_at,
           c.name AS category_name, c.slug AS category_slug,
           MIN(v.price_cents) AS price_from_cents,
           BOOL_OR(v.stock > 0) AS in_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    JOIN product_variants v ON v.product_id = p.id AND v.is_active = true
    WHERE ${conditions.join(" AND ")}
    GROUP BY p.id, c.id
    ${having.length ? `HAVING ${having.join(" AND ")}` : ""}`;

  const countSql = `SELECT COUNT(*)::int AS total FROM (${groupedSql}) AS t`;
  const countParams = [...params]; // before LIMIT/OFFSET are added

  const dataSql = `${groupedSql}
    ORDER BY ${SORT_SQL[sort]}
    LIMIT ${add(limit)} OFFSET ${add((page - 1) * limit)}`;

  const [countResult, dataResult] = await Promise.all([
    pool.query<{ total: number }>(countSql, countParams),
    pool.query<ProductRow>(dataSql, params),
  ]);

  const total = countResult.rows[0]!.total;

  return {
    items: dataResult.rows.map(toProduct),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductBySlug(slug: string) {
  const productResult = await pool.query<ProductRow>(
    `SELECT p.id, p.name, p.slug, p.description, p.origin_info, p.roast_info,
            p.image_url,
            c.name AS category_name, c.slug AS category_slug,
            0 AS price_from_cents, false AS in_stock
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = $1 AND p.is_active = true`,
    [slug],
  );

  const product = productResult.rows[0];
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Expose "in stock or not", not the exact stock number.
  const variantResult = await pool.query<VariantRow>(
    `SELECT id, sku, size_grams, grind, price_cents, (stock > 0) AS in_stock
     FROM product_variants
     WHERE product_id = $1 AND is_active = true
     ORDER BY size_grams, grind`,
    [product.id],
  );

  const variants = variantResult.rows.map((v) => ({
    id: v.id,
    sku: v.sku,
    sizeGrams: v.size_grams,
    grind: v.grind,
    priceCents: v.price_cents,
    inStock: v.in_stock,
  }));

  return {
    ...toProduct({
      ...product,
      // Computed from the variants instead of in SQL.
      price_from_cents: variants.length ? Math.min(...variants.map((v) => v.priceCents)) : 0,
      in_stock: variants.some((v) => v.inStock),
    }),
    variants,
  };
}