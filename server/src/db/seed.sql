-- Sample catalog data for development. Safe to re-run (skips rows that already exist).
-- Run: psql "$DATABASE_URL" -f src/db/seed.sql

INSERT INTO categories (name, slug) VALUES
  ('Single Origin', 'single-origin'),
  ('Blends',        'blends')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, origin_info, roast_info)
SELECT c.id, v.name, v.slug, v.description, v.origin_info, v.roast_info
FROM (VALUES
  ('single-origin', 'Yirgacheffe Washed', 'yirgacheffe-washed',
   'Bright and floral with citrus and jasmine notes.',
   'Yirgacheffe, Gedeo Zone', 'Light roast'),
  ('single-origin', 'Sidamo Natural', 'sidamo-natural',
   'Fruit-forward with blueberry and a syrupy body.',
   'Sidama Region', 'Medium-light roast'),
  ('single-origin', 'Guji Natural', 'guji-natural',
   'Sweet and juicy with stone fruit and a floral finish.',
   'Guji Zone, Oromia', 'Light roast'),
  ('single-origin', 'Harar Longberry', 'harar-longberry',
   'Wine-like and earthy with dried fruit and spice.',
   'Harar, Eastern Highlands', 'Medium roast'),
  ('single-origin', 'Limu Washed', 'limu-washed',
   'Balanced and smooth with a sweet, winey acidity.',
   'Limu, Jimma Zone', 'Medium roast'),
  ('blends', 'Habesha House Blend', 'habesha-house-blend',
   'Our everyday blend: chocolate, nuts and gentle fruit.',
   'Blend of Ethiopian regions', 'Medium-dark roast')
) AS v(category_slug, name, slug, description, origin_info, roast_info)
JOIN categories c ON c.slug = v.category_slug
ON CONFLICT (slug) DO NOTHING;

-- Three variants for every product: 250g whole bean, 250g ground, 1kg whole bean.
INSERT INTO product_variants (product_id, sku, size_grams, grind, price_cents, stock)
SELECT p.id, upper(p.slug) || '-' || v.code, v.size_grams, v.grind, v.price_cents, 50
FROM products p
CROSS JOIN (VALUES
  ('250WB', 250,  'whole bean', 1800),
  ('250GR', 250,  'ground',     1800),
  ('1KWB',  1000, 'whole bean', 6200)
) AS v(code, size_grams, grind, price_cents)
ON CONFLICT (sku) DO NOTHING;

-- Make the data more varied so filters, sorting and stock status can be tested.
UPDATE product_variants SET price_cents = 1500
WHERE sku LIKE 'HABESHA-HOUSE-BLEND-250%';

UPDATE product_variants SET price_cents = 2200
WHERE sku LIKE 'GUJI-NATURAL-250%';

UPDATE product_variants SET stock = 0
WHERE sku = 'HARAR-LONGBERRY-1KWB';