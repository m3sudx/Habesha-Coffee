import pool from '../config/db.js';
import ApiError from '../utils/ApiError.js';

const CART_SQL = `
  SELECT
    ci.id::int                  AS "id",
    ci.variant_id::int          AS "variantId",
    p.name                      AS "productName",
    p.slug                      AS "slug",
    v.label                     AS "variantLabel",
    (
      SELECT pi.url
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.position ASC
      LIMIT 1
    )                           AS "image",
    v.price_cents               AS "unitPriceCents",
    ci.quantity                 AS "quantity",
    v.price_cents * ci.quantity AS "lineTotalCents",
    v.stock                     AS "stock"
  FROM carts c
  JOIN cart_items ci      ON ci.cart_id = c.id
  JOIN product_variants v ON v.id = ci.variant_id
  JOIN products p         ON p.id = v.product_id
  WHERE c.user_id = $1 OR c.session_id = $2
  ORDER BY ci.id ASC
`;

// Returns the full cart. Every cart endpoint will end by calling this.
export async function getCart({ userId, sessionId }) {
  const { rows } = await pool.query(CART_SQL, [userId, sessionId]);
  return {
    items: rows,
    itemCount: rows.reduce((n, r) => n + r.quantity, 0),
    subtotalCents: rows.reduce((n, r) => n + r.lineTotalCents, 0),
  };
}

// Finds the owner's cart, or creates it. Returns the cart id.
// "DO UPDATE" (instead of DO NOTHING) makes RETURNING give us the id in both cases.
async function findOrCreateCartId({ userId, sessionId }) {
  const sql = userId
    ? `INSERT INTO carts (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
       RETURNING id`
    : `INSERT INTO carts (session_id) VALUES ($1)
       ON CONFLICT (session_id) DO UPDATE SET updated_at = now()
       RETURNING id`;
  const { rows } = await pool.query(sql, [userId ?? sessionId]);
  return rows[0].id;
}

export async function addToCart(owner, variantId, quantity) {
  // 1. Does this variant exist, and is it for sale? How much stock is there?
  const { rows: [variant] } = await pool.query(
    `SELECT v.stock
     FROM product_variants v
     JOIN products p ON p.id = v.product_id
     WHERE v.id = $1 AND v.is_active = true AND p.is_active = true`,
    [variantId]
  );
  if (!variant) throw new ApiError(404, 'Product variant not found');

  const notEnough = `Not enough stock (only ${variant.stock} available)`;
  if (quantity > variant.stock) throw new ApiError(409, notEnough);

  // 2. Make sure the owner has a cart
  const cartId = await findOrCreateCartId(owner);

  // 3. Add the item. If it is already in the cart, increase the quantity,
  //    but only when the new total still fits in the stock.
  const { rowCount } = await pool.query(
    `INSERT INTO cart_items (cart_id, variant_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, variant_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
     WHERE cart_items.quantity + EXCLUDED.quantity <= $4`,
    [cartId, variantId, quantity, variant.stock]
  );
  if (rowCount === 0) throw new ApiError(409, notEnough); // the WHERE blocked the update
}

// SQL that means "carts that belong to this owner"
const OWNER_CARTS = `SELECT id FROM carts WHERE user_id = $2 OR session_id = $3`;

export async function updateItemQuantity(owner, itemId, quantity) {
  // 1. Find the item, but ONLY if it is in this owner's cart
  const { rows: [item] } = await pool.query(
    `SELECT v.stock
     FROM cart_items ci
     JOIN product_variants v ON v.id = ci.variant_id
     WHERE ci.id = $1 AND ci.cart_id IN (${OWNER_CARTS})`,
    [itemId, owner.userId, owner.sessionId]
  );
  if (!item) throw new ApiError(404, 'Cart item not found');

  if (quantity > item.stock) {
    throw new ApiError(409, `Not enough stock (only ${item.stock} available)`);
  }

  // 2. Update it
  await pool.query('UPDATE cart_items SET quantity = $2 WHERE id = $1', [itemId, quantity]);
}

export async function removeItem(owner, itemId) {
  const { rowCount } = await pool.query(
    `DELETE FROM cart_items
     WHERE id = $1 AND cart_id IN (${OWNER_CARTS})`,
    [itemId, owner.userId, owner.sessionId]
  );
  if (rowCount === 0) throw new ApiError(404, 'Cart item not found');
}

export async function emptyCart(owner) {
  await pool.query(
    `DELETE FROM cart_items
     WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1 OR session_id = $2)`,
    [owner.userId, owner.sessionId]
  );
}

// Moves a guest cart into the user's cart. All steps succeed together or none do.
export async function mergeGuestCart(userId, sessionId) {
  const client = await pool.connect(); // one connection for the whole transaction
  try {
    await client.query('BEGIN');

    // 1. Find the guest cart and lock it, so two merges cannot run at the same time
    const { rows: [guest] } = await client.query(
      'SELECT id FROM carts WHERE session_id = $1 FOR UPDATE',
      [sessionId]
    );

    if (guest) {
      // 2. Make sure the user has a cart
      const { rows: [mine] } = await client.query(
        `INSERT INTO carts (user_id) VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
         RETURNING id`,
        [userId]
      );

      // 3. Copy the items. Same variant in both carts: add the quantities.
      //    Never go above the stock, and skip items that can no longer be bought.
      await client.query(
        `INSERT INTO cart_items (cart_id, variant_id, quantity)
         SELECT $1, gi.variant_id, LEAST(gi.quantity, v.stock)
         FROM cart_items gi
         JOIN product_variants v ON v.id = gi.variant_id
         JOIN products p ON p.id = v.product_id
         WHERE gi.cart_id = $2 AND v.is_active = true AND p.is_active = true AND v.stock > 0
         ON CONFLICT (cart_id, variant_id)
         DO UPDATE SET quantity = LEAST(
           cart_items.quantity + EXCLUDED.quantity,
           (SELECT stock FROM product_variants WHERE id = EXCLUDED.variant_id)
         )`,
        [mine.id, guest.id]
      );

      // 4. The guest cart is no longer needed
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [guest.id]);
      await client.query('DELETE FROM carts WHERE id = $1', [guest.id]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK'); // undo everything done since BEGIN
    throw err;
  } finally {
    client.release(); // always give the connection back to the pool
  }
}