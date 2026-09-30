import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

// Development-only login details
const ADMIN = { name: 'Admin', email: 'admin@habeshacoffee.test', password: 'Admin123!' };
const CUSTOMER = { name: 'Demo Customer', email: 'customer@habeshacoffee.test', password: 'Customer123!' };

// Sample products. Prices are in cents (1800 = $18.00) and are placeholders.
const products = [
  {
    code: 'YIR', name: 'Yirgacheffe', slug: 'yirgacheffe', roast: 'light',
    origin: 'Yirgacheffe, Gedeo Zone', notes: 'Jasmine, bergamot, lemon',
    description: 'A bright, floral light roast from the highlands of Yirgacheffe.',
    basePrice: 1800,
  },
  {
    code: 'SID', name: 'Sidamo', slug: 'sidamo', roast: 'medium',
    origin: 'Sidama Region', notes: 'Blueberry, cocoa, citrus',
    description: 'A balanced medium roast with fruity sweetness and a smooth finish.',
    basePrice: 1700,
  },
  {
    code: 'HAR', name: 'Harrar', slug: 'harrar', roast: 'medium',
    origin: 'Harrar, Eastern Highlands', notes: 'Dried fruit, wine, spice',
    description: 'A bold, fruit-forward medium roast with a winey character.',
    basePrice: 1900,
  },
  {
    code: 'LIM', name: 'Limu', slug: 'limu', roast: 'dark',
    origin: 'Limu, Oromia', notes: 'Dark chocolate, spice, caramel',
    description: 'A rich dark roast with a full body and a sweet, spicy finish.',
    basePrice: 1600,
  },
];

// Each product gets three size/grind options. 1kg costs 3.5x the 250g price.
const variantsFor = (p) => [
  { label: '250g whole bean', price: p.basePrice, stock: 40, sku: `${p.code}-250-WB` },
  { label: '250g ground', price: p.basePrice, stock: 40, sku: `${p.code}-250-GR` },
  { label: '1kg whole bean', price: p.basePrice * 3.5, stock: 15, sku: `${p.code}-1000-WB` },
];

async function seed() {
  if (env.nodeEnv === 'production') {
    throw new Error('Refusing to seed the production database');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Wipe existing data so the seed can be run again and again.
    // RESTART IDENTITY resets ids to 1, CASCADE follows the foreign keys.
    await client.query(`
      TRUNCATE order_items, orders, cart_items, carts, discount_codes,
               product_images, product_variants, products, categories, users
      RESTART IDENTITY CASCADE
    `);

    // Users (passwords are hashed, never stored as plain text)
    for (const u of [
      { ...ADMIN, role: 'admin' },
      { ...CUSTOMER, role: 'customer' },
    ]) {
      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [u.name, u.email, hash, u.role]
      );
    }

    // Category
    const { rows: [category] } = await client.query(
      `INSERT INTO categories (name, slug) VALUES ('Single origin', 'single-origin') RETURNING id`
    );

    // Products, their images and their variants
    for (const p of products) {
      const { rows: [product] } = await client.query(
        `INSERT INTO products (category_id, name, slug, description, origin, roast, tasting_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [category.id, p.name, p.slug, p.description, p.origin, p.roast, p.notes]
      );

      await client.query(
        'INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, 0)',
        [product.id, `/images/${p.slug}-1.jpg`]
      );

      for (const v of variantsFor(p)) {
        await client.query(
          `INSERT INTO product_variants (product_id, label, price_cents, stock, sku)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, v.label, v.price, v.stock, v.sku]
        );
      }
    }

    // Discount codes
    await client.query(`
      INSERT INTO discount_codes (code, type, value, min_order_cents, usage_limit)
      VALUES ('WELCOME10', 'percent', 10, 0, NULL),
             ('SAVE5', 'fixed', 500, 3000, 100)
    `);

    await client.query('COMMIT');
    console.log('Seed complete.');
    console.log(`  Admin:    ${ADMIN.email} / ${ADMIN.password}`);
    console.log(`  Customer: ${CUSTOMER.email} / ${CUSTOMER.password}`);
    console.log('  Discount codes: WELCOME10 (10%), SAVE5 ($5 off orders over $30)');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());