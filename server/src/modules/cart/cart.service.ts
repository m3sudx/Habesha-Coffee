import { pool } from "../../config/db.js";
import { AppError } from "../../utils/error.js";

// A cart belongs either to a logged-in user or to a guest session.
export type CartOwner = { userId: string } | { sessionId: string };

type CartItemRow = {
  variant_id: string;
  quantity: number;
  sku: string;
  size_grams: number;
  grind: string;
  price_cents: number;
  stock: number;
  variant_active: boolean;
  product_id: string;
  product_name: string;
  product_slug: string;
  image_url: string | null;
  product_active: boolean;
};

function ownerColumn(owner: CartOwner): { column: "user_id" | "session_id"; value: string } {
  return "userId" in owner
    ? { column: "user_id", value: owner.userId }
    : { column: "session_id", value: owner.sessionId };
}

async function findCartId(owner: CartOwner): Promise<string | null> {
  const { column, value } = ownerColumn(owner);
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM carts WHERE ${column} = $1`,
    [value],
  );
  return rows[0]?.id ?? null;
}

// Upsert against the partial unique index, so two simultaneous requests
// can't create two carts for the same owner.
async function getOrCreateCartId(owner: CartOwner): Promise<string> {
  const { column, value } = ownerColumn(owner);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO carts (${column}) VALUES ($1)
     ON CONFLICT (${column}) WHERE ${column} IS NOT NULL
     DO UPDATE SET updated_at = now()
     RETURNING id`,
    [value],
  );
  return rows[0]!.id;
}

export async function getCart(owner: CartOwner) {
  const cartId = await findCartId(owner);

  if (!cartId) {
    return { id: null, items: [], itemCount: 0, subtotalCents: 0 };
  }

  const { rows } = await pool.query<CartItemRow>(
    `SELECT ci.variant_id, ci.quantity,
            v.sku, v.size_grams, v.grind, v.price_cents, v.stock,
            v.is_active AS variant_active,
            p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
            p.image_url, p.is_active AS product_active
     FROM cart_items ci
     JOIN product_variants v ON v.id = ci.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at, ci.id`,
    [cartId],
  );

  const items = rows.map((r) => {
    // "available" means it could be bought right now in this quantity.
    const available = r.variant_active && r.product_active && r.stock >= r.quantity;
    return {
      variantId: r.variant_id,
      productId: r.product_id,
      productName: r.product_name,
      productSlug: r.product_slug,
      imageUrl: r.image_url,
      sku: r.sku,
      sizeGrams: r.size_grams,
      grind: r.grind,
      unitPriceCents: r.price_cents,
      quantity: r.quantity,
      lineTotalCents: r.price_cents * r.quantity,
      maxQuantity: Math.max(r.stock, 0),
      available,
    };
  });

  return {
    id: cartId,
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    // Only items that can actually be bought count towards the subtotal.
    subtotalCents: items.filter((i) => i.available).reduce((sum, i) => sum + i.lineTotalCents, 0),
  };
}

async function getActiveVariant(variantId: string) {
  const { rows } = await pool.query<{ stock: number }>(
    `SELECT v.stock
     FROM product_variants v
     JOIN products p ON p.id = v.product_id
     WHERE v.id = $1 AND v.is_active = true AND p.is_active = true`,
    [variantId],
  );

  const variant = rows[0];
  if (!variant) {
    throw new AppError("Product variant not found", 404);
  }
  return variant;
}

function assertEnoughStock(requested: number, stock: number): void {
  if (requested > stock) {
    const message =
      stock === 0 ? "This item is out of stock" : `Only ${stock} left in stock`;
    throw new AppError(message, 409);
  }
}

// Adds to the quantity already in the cart. Stock is checked again at checkout,
// which is the authoritative check.
export async function addItem(owner: CartOwner, variantId: string, quantity: number) {
  const { stock } = await getActiveVariant(variantId);
  const cartId = await getOrCreateCartId(owner);

  const existing = await pool.query<{ quantity: number }>(
    "SELECT quantity FROM cart_items WHERE cart_id = $1 AND variant_id = $2",
    [cartId, variantId],
  );
  const currentQuantity = existing.rows[0]?.quantity ?? 0;

  assertEnoughStock(currentQuantity + quantity, stock);

  await pool.query(
    `INSERT INTO cart_items (cart_id, variant_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, variant_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
    [cartId, variantId, quantity],
  );

  return getCart(owner);
}

// Sets the quantity to an exact value.
export async function setItemQuantity(owner: CartOwner, variantId: string, quantity: number) {
  const cartId = await findCartId(owner);
  if (!cartId) {
    throw new AppError("Item not in cart", 404);
  }

  const { stock } = await getActiveVariant(variantId);
  assertEnoughStock(quantity, stock);

  const result = await pool.query(
    "UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND variant_id = $3",
    [quantity, cartId, variantId],
  );
  if (result.rowCount === 0) {
    throw new AppError("Item not in cart", 404);
  }

  return getCart(owner);
}

// Removing something that isn't there is not an error (the end result is the same).
export async function removeItem(owner: CartOwner, variantId: string) {
  const cartId = await findCartId(owner);

  if (cartId) {
    await pool.query(
      "DELETE FROM cart_items WHERE cart_id = $1 AND variant_id = $2",
      [cartId, variantId],
    );
  }

  return getCart(owner);
}

// Called after login: moves the guest cart's items into the user's cart.
export async function mergeGuestCart(userId: string, sessionId: string) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const guest = await client.query<{ id: string }>(
      "SELECT id FROM carts WHERE session_id = $1",
      [sessionId],
    );
    const guestCartId = guest.rows[0]?.id;

    if (guestCartId) {
      const userCart = await client.query<{ id: string }>(
        `INSERT INTO carts (user_id) VALUES ($1)
         ON CONFLICT (user_id) WHERE user_id IS NOT NULL
         DO UPDATE SET updated_at = now()
         RETURNING id`,
        [userId],
      );
      const userCartId = userCart.rows[0]!.id;

      // Quantities are added together and capped at the available stock.
      // Items that are inactive or out of stock are dropped.
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
        [userCartId, guestCartId],
      );

      // Deleting the guest cart also deletes its items (ON DELETE CASCADE).
      await client.query("DELETE FROM carts WHERE id = $1", [guestCartId]);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return getCart({ userId });
}