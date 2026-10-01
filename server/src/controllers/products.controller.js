import { matchedData } from "express-validator";
import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const products = async (req, res) => {
    const {
      search = null,
      category = null,
      roast = null,
      minPrice = null,
      maxPrice = null,
      sort = "newest",
      limit = 12,
      page = 1,
    } = matchedData(req); // validated + converted values (req.query is read-only in Express 5)

    const query = `
      SELECT 
        p.id::int AS id,
        p.name,
        p.slug,
        p.roast,
        p.origin,
        (
          SELECT pi.url 
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.position ASC 
          LIMIT 1
        ) AS image,
        MIN(v.price_cents) AS "priceFromCents",
        COALESCE(BOOL_OR(v.stock > 0), false) AS "inStock",
        COUNT(*) OVER()::int AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN product_variants v ON p.id = v.product_id AND v.is_active = true
      WHERE p.is_active = true
        AND (
          $1::text IS NULL OR 
          p.name ILIKE '%' || $1 || '%' OR 
          p.origin ILIKE '%' || $1 || '%' OR 
          p.tasting_notes ILIKE '%' || $1 || '%'
        )
        AND ($2::text IS NULL OR c.slug = $2)
        AND ($3::text IS NULL OR p.roast = $3::roast_level)
      GROUP BY p.id
      HAVING ($4::int IS NULL OR MIN(v.price_cents) >= $4)
         AND ($5::int IS NULL OR MIN(v.price_cents) <= $5)
      ORDER BY
        CASE WHEN $6 = 'price_asc'  THEN MIN(v.price_cents) END ASC,
        CASE WHEN $6 = 'price_desc' THEN MIN(v.price_cents) END DESC,
        CASE WHEN $6 = 'name'       THEN p.name             END ASC,
        p.created_at DESC
      LIMIT $7 OFFSET ($8 - 1) * $7;
    `;

    const values = [search, category, roast, minPrice, maxPrice, sort, limit, page];

    const { rows } = await pool.query(query, values);
    const total = rows[0]?.total ?? 0;

    res.status(200).json({
      success: true,
      data: rows.map(({ total, ...product }) => product),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
};

export const getProductBySlug = async (req, res) => {
    const { slug } = req.params;

    const query = `
      SELECT 
        p.id::int AS id,
        p.name,
        p.slug,
        p.roast,
        p.description,
        p.origin,
        p.tasting_notes AS "tastingNotes",
        CASE 
          WHEN c.id IS NOT NULL THEN json_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug
          )
          ELSE NULL 
        END AS category,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pi.id,
                'url', pi.url,
                'position', pi.position
              ) ORDER BY pi.position ASC
            )
            FROM product_images pi
            WHERE pi.product_id = p.id
          ),
          '[]'::json
        ) AS images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pv.id,
                'label', pv.label,
                'priceCents', pv.price_cents,
                'stock', pv.stock,
                'sku', pv.sku
              ) ORDER BY pv.id ASC
            )
            FROM product_variants pv
            WHERE pv.product_id = p.id AND pv.is_active = true
          ),
          '[]'::json
        ) AS variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = $1 AND p.is_active = true;
    `;

    const result = await pool.query(query, [slug]);

    if (result.rows.length === 0) {
      throw new ApiError(404, "Product not found");
    }

    res.status(200).json({
      success: true,
      product: result.rows[0],
    });
};