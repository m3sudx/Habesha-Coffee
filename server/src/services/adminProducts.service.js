import pool from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import slugify from '../utils/slugify.js';

// The ONLY columns an update may touch. The names on the left come from the request,
// the column names on the right are ours.
const COLUMNS = {
  name: 'name',
  slug: 'slug',
  description: 'description',
  origin: 'origin',
  roast: 'roast',
  tastingNotes: 'tasting_notes',
  categoryId: 'category_id',
  isActive: 'is_active',
};

// Turn database errors into friendly API errors
function translateError(err) {
  if (err.code === '23505') return new ApiError(409, 'A product with this slug already exists');
  if (err.code === '23503') return new ApiError(400, 'Category not found');
  return err;
}

export async function adminListProducts({ search, page, limit }) {
  const { rows } = await pool.query(
    `SELECT p.id::int AS id, p.name, p.slug, p.roast, p.is_active AS "isActive",
            (SELECT COUNT(*)::int FROM product_variants v WHERE v.product_id = p.id) AS "variantCount",
            (SELECT COALESCE(SUM(v.stock), 0)::int FROM product_variants v WHERE v.product_id = p.id) AS "totalStock",
            COUNT(*) OVER()::int AS total
     FROM products p
     WHERE $1::text IS NULL OR p.name ILIKE '%' || $1 || '%' OR p.slug ILIKE '%' || $1 || '%'
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $2 OFFSET ($3 - 1) * $2`,
    [search, limit, page]
  );
  const total = rows[0]?.total ?? 0;
  return {
    data: rows.map(({ total, ...product }) => product),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// One product with ALL its variants (also inactive ones) and images, for the edit page
export async function adminGetProduct(id) {
  const { rows: [product] } = await pool.query(
    `SELECT p.id::int AS id, p.name, p.slug, p.description, p.origin, p.roast,
            p.tasting_notes AS "tastingNotes", p.category_id::int AS "categoryId",
            p.is_active AS "isActive", p.created_at AS "createdAt",
            COALESCE((
              SELECT json_agg(json_build_object(
                       'id', pv.id::int, 'label', pv.label, 'priceCents', pv.price_cents,
                       'stock', pv.stock, 'sku', pv.sku, 'isActive', pv.is_active
                     ) ORDER BY pv.id)
              FROM product_variants pv WHERE pv.product_id = p.id
            ), '[]'::json) AS variants,
            COALESCE((
              SELECT json_agg(json_build_object('id', pi.id::int, 'url', pi.url, 'position', pi.position)
                              ORDER BY pi.position, pi.id)
              FROM product_images pi WHERE pi.product_id = p.id
            ), '[]'::json) AS images
     FROM products p
     WHERE p.id = $1`,
    [id]
  );
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

export async function createProduct(data) {
  const slug = data.slug ?? slugify(data.name);
  if (!slug) throw new ApiError(400, 'Could not make a slug from the name, please provide one');

  try {
    const { rows: [row] } = await pool.query(
      `INSERT INTO products (name, slug, description, origin, roast, tasting_notes, category_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id::int AS id`,
      [data.name, slug, data.description ?? '', data.origin ?? null, data.roast,
       data.tastingNotes ?? null, data.categoryId ?? null, data.isActive ?? true]
    );
    return adminGetProduct(row.id);
  } catch (err) {
    throw translateError(err);
  }
}

// Changes ONLY the fields that were sent
export async function updateProduct(id, fields) {
  const keys = Object.keys(fields).filter((k) => k in COLUMNS);
  if (keys.length === 0) throw new ApiError(400, 'Send at least one field to update');

  // name = $2, roast = $3, ...  ($1 is the id)
  const sets = keys.map((k, i) => `${COLUMNS[k]} = $${i + 2}`);
  const values = keys.map((k) => fields[k]);

  try {
    const { rowCount } = await pool.query(
      `UPDATE products SET ${sets.join(', ')} WHERE id = $1`,
      [id, ...values]
    );
    if (rowCount === 0) throw new ApiError(404, 'Product not found');
  } catch (err) {
    throw translateError(err);
  }
  return adminGetProduct(id);
}

// "Delete" only hides the product: old orders still point at its variants
export async function hideProduct(id) {
  const { rowCount } = await pool.query('UPDATE products SET is_active = false WHERE id = $1', [id]);
  if (rowCount === 0) throw new ApiError(404, 'Product not found');
}