import { pool } from "../../config/db.js";
import { AppError } from "../../utils/error.js";
import { slugify } from "../../utils/slug.js";
import type {
  AdminProductListQuery,
  CreateProductInput,
  CreateVariantInput,
  UpdateProductInput,
  UpdateVariantInput,
} from "./admin-product.schema.js";

// ---------- helpers ----------

type PgError = { code?: string; constraint?: string };

// The caught value in a catch block is `unknown`, so check its shape safely.
function asPgError(err: unknown): PgError {
  return typeof err === "object" && err !== null ? (err as PgError) : {};
}

// Escape LIKE wildcards so a search for "100%" doesn't match everything.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

// Request field name -> database column. Column names only ever come from these maps
// (never from user input), so building the SET clause is safe.
const PRODUCT_COLUMNS: Record<string, string> = {
  name: "name",
  slug: "slug",
  description: "description",
  originInfo: "origin_info",
  roastInfo: "roast_info",
  imageUrl: "image_url",
  categoryId: "category_id",
  isActive: "is_active",
};

const VARIANT_COLUMNS: Record<string, string> = {
  sku: "sku",
  sizeGrams: "size_grams",
  grind: "grind",
  priceCents: "price_cents",
  stock: "stock",
  isActive: "is_active",
};

// Builds "col = $1, col2 = $2" only for the fields that were sent.
function buildSet(input: Record<string, unknown>, columns: Record<string, string>) {
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(input)) {
    const column = columns[key];
    if (value === undefined || !column) continue;
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  }
  return { sets, values };
}

function throwProductWriteError(err: unknown): never {
  const { code } = asPgError(err);
  if (code === "23505") throw new AppError("A product with this slug already exists", 409);
  if (code === "23503") throw new AppError("Category not found", 400);
  throw err;
}

function throwVariantWriteError(err: unknown): never {
  const { code, constraint } = asPgError(err);
  if (code === "23505") {
    if (constraint?.includes("sku")) {
      throw new AppError("This SKU already exists", 409);
    }
    throw new AppError("This product already has a variant with this size and grind", 409);
  }
  if (code === "23503") throw new AppError("Product not found", 404);
  throw err;
}

// ---------- reads ----------

type ProductSummaryRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
  category_name: string | null;
  category_slug: string | null;
  variant_count: number;
  price_from_cents: number | null;
  total_stock: number;
};

export async function listAdminProducts({
  page,
  limit,
  q,
  category,
  isActive,
}: AdminProductListQuery) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  // Pushes a value and returns its placeholder ($1, $2, ...), so conditions
  // and parameters are always built together and stay in sync.
  const add = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  if (q) {
    const p = add(`%${escapeLike(q)}%`);
    conditions.push(`(p.name ILIKE ${p} OR p.slug ILIKE ${p})`);
  }
  if (category) {
    conditions.push(`c.slug = ${add(category)}`);
  }
  if (isActive !== undefined) {
    conditions.push(`p.is_active = ${add(isActive)}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countParams = [...params]; // before LIMIT/OFFSET are added

  const dataSql = `
    SELECT p.id, p.name, p.slug, p.image_url, p.is_active, p.created_at,
           c.name AS category_name, c.slug AS category_slug,
           COUNT(v.id)::int AS variant_count,
           MIN(v.price_cents) FILTER (WHERE v.is_active) AS price_from_cents,
           COALESCE(SUM(v.stock), 0)::int AS total_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_variants v ON v.product_id = p.id
    ${whereSql}
    GROUP BY p.id, c.id
    ORDER BY p.created_at DESC, p.id
    LIMIT ${add(limit)} OFFSET ${add((page - 1) * limit)}`;

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${whereSql}`;

  const [countResult, dataResult] = await Promise.all([
    pool.query<{ total: number }>(countSql, countParams),
    pool.query<ProductSummaryRow>(dataSql, params),
  ]);

  const total = countResult.rows[0]!.total;

  return {
    items: dataResult.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      imageUrl: r.image_url,
      isActive: r.is_active,
      category: r.category_slug ? { name: r.category_name, slug: r.category_slug } : null,
      variantCount: r.variant_count,
      priceFromCents: r.price_from_cents,
      totalStock: r.total_stock,
      createdAt: r.created_at,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  origin_info: string | null;
  roast_info: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
};

type VariantRow = {
  id: string;
  sku: string;
  size_grams: number;
  grind: string;
  price_cents: number;
  stock: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

// Unlike the public catalog, this returns inactive variants and the exact stock.
export async function getAdminProduct(productId: string) {
  const productResult = await pool.query<ProductRow>(
    `SELECT p.id, p.name, p.slug, p.description, p.origin_info, p.roast_info, p.image_url,
            p.is_active, p.created_at, p.updated_at,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [productId],
  );

  const product = productResult.rows[0];
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const variantResult = await pool.query<VariantRow>(
    `SELECT id, sku, size_grams, grind, price_cents, stock, is_active, created_at, updated_at
     FROM product_variants
     WHERE product_id = $1
     ORDER BY size_grams, grind`,
    [productId],
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    originInfo: product.origin_info,
    roastInfo: product.roast_info,
    imageUrl: product.image_url,
    isActive: product.is_active,
    category: product.category_id
      ? { id: product.category_id, name: product.category_name, slug: product.category_slug }
      : null,
    variants: variantResult.rows.map((v) => ({
      id: v.id,
      sku: v.sku,
      sizeGrams: v.size_grams,
      grind: v.grind,
      priceCents: v.price_cents,
      stock: v.stock,
      isActive: v.is_active,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    })),
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

// ---------- product writes ----------

export async function createProduct(input: CreateProductInput) {
  const slug = input.slug ?? slugify(input.name);
  if (!slug) {
    throw new AppError("Could not create a slug from the name. Please send a slug.", 400);
  }

  try {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO products
         (category_id, name, slug, description, origin_info, roast_info, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        input.categoryId ?? null,
        input.name,
        slug,
        input.description ?? null,
        input.originInfo ?? null,
        input.roastInfo ?? null,
        input.imageUrl ?? null,
        input.isActive,
      ],
    );
    return getAdminProduct(rows[0]!.id);
  } catch (err) {
    return throwProductWriteError(err);
  }
}

export async function updateProduct(productId: string, input: UpdateProductInput) {
  const { sets, values } = buildSet(input, PRODUCT_COLUMNS);

  try {
    const result = await pool.query(
      `UPDATE products SET ${sets.join(", ")} WHERE id = $${values.length + 1} RETURNING id`,
      [...values, productId],
    );
    if (result.rowCount === 0) {
      throw new AppError("Product not found", 404);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    return throwProductWriteError(err);
  }

  return getAdminProduct(productId);
}

// ---------- variant writes ----------

export async function createVariant(productId: string, input: CreateVariantInput) {
  try {
    await pool.query(
      `INSERT INTO product_variants
         (product_id, sku, size_grams, grind, price_cents, stock, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [productId, input.sku, input.sizeGrams, input.grind, input.priceCents, input.stock, input.isActive],
    );
  } catch (err) {
    return throwVariantWriteError(err);
  }

  return getAdminProduct(productId);
}

export async function updateVariant(
  productId: string,
  variantId: string,
  input: UpdateVariantInput,
) {
  const { sets, values } = buildSet(input, VARIANT_COLUMNS);

  try {
    // The variant must belong to the product in the URL.
    const result = await pool.query(
      `UPDATE product_variants SET ${sets.join(", ")}
       WHERE id = $${values.length + 1} AND product_id = $${values.length + 2}
       RETURNING id`,
      [...values, variantId, productId],
    );
    if (result.rowCount === 0) {
      throw new AppError("Variant not found", 404);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    return throwVariantWriteError(err);
  }

  return getAdminProduct(productId);
}