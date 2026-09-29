-- Buna House: PostgreSQL schema
-- Run on a fresh database. To reset during development: dropdb buna_house && createdb buna_house

-- ---------- Enums ----------
CREATE TYPE user_role     AS ENUM ('customer', 'admin');
CREATE TYPE roast_level   AS ENUM ('light', 'medium', 'dark');
CREATE TYPE order_status  AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE discount_type AS ENUM ('percent', 'fixed');

-- ---------- updated_at trigger ----------
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- Users ----------
CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Emails are compared case-insensitively
CREATE UNIQUE INDEX users_email_key ON users (lower(email));

-- ---------- Catalog ----------
CREATE TABLE categories (
  id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id   BIGINT      REFERENCES categories(id) ON DELETE SET NULL,
  name          TEXT        NOT NULL,
  slug          TEXT        NOT NULL UNIQUE,
  description   TEXT        NOT NULL DEFAULT '',
  origin        TEXT,
  roast         roast_level NOT NULL,
  tasting_notes TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products (category_id);
CREATE INDEX products_active_idx   ON products (is_active);

CREATE TABLE product_images (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT  NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT    NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX product_images_product_idx ON product_images (product_id);

-- One row per size/grind option, e.g. "250g whole bean"
CREATE TABLE product_variants (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  BIGINT  NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       TEXT    NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku         TEXT    NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (product_id, label)
);
CREATE INDEX variants_product_idx ON product_variants (product_id);

-- ---------- Cart ----------
-- A cart belongs to a logged-in user OR to a guest session (never neither)
CREATE TABLE carts (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID   UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE cart_items (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cart_id    BIGINT  NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id BIGINT  NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (cart_id, variant_id)
);
CREATE INDEX cart_items_cart_idx ON cart_items (cart_id);

-- ---------- Discounts ----------
CREATE TABLE discount_codes (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code             TEXT          NOT NULL,
  type             discount_type NOT NULL,
  value            INTEGER       NOT NULL CHECK (value > 0),  -- percent (1-100) or cents
  min_order_cents  INTEGER       NOT NULL DEFAULT 0 CHECK (min_order_cents >= 0),
  expires_at       TIMESTAMPTZ,
  usage_limit      INTEGER CHECK (usage_limit > 0),           -- NULL = unlimited
  times_used       INTEGER       NOT NULL DEFAULT 0 CHECK (times_used >= 0),
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CHECK (type <> 'percent' OR value <= 100)
);
CREATE UNIQUE INDEX discount_codes_code_key ON discount_codes (upper(code));

-- ---------- Orders ----------
CREATE TABLE orders (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id                 BIGINT       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status                  order_status NOT NULL DEFAULT 'pending',
  subtotal_cents          INTEGER      NOT NULL CHECK (subtotal_cents >= 0),
  discount_cents          INTEGER      NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents             INTEGER      NOT NULL CHECK (total_cents >= 0),
  discount_code_id        BIGINT       REFERENCES discount_codes(id) ON DELETE SET NULL,
  stripe_session_id       TEXT UNIQUE,
  stripe_payment_intent   TEXT,
  shipping_name           TEXT         NOT NULL,
  shipping_phone          TEXT,
  shipping_address        TEXT         NOT NULL,
  shipping_city           TEXT         NOT NULL,
  shipping_country        TEXT         NOT NULL,
  paid_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (total_cents = subtotal_cents - discount_cents)
);
CREATE INDEX orders_user_idx    ON orders (user_id);
CREATE INDEX orders_status_idx  ON orders (status);
CREATE INDEX orders_created_idx ON orders (created_at DESC);

-- Snapshot of what was bought: name and price are copied at purchase time
CREATE TABLE order_items (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id         BIGINT  NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id       BIGINT  REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name     TEXT    NOT NULL,
  variant_label    TEXT    NOT NULL,
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  quantity         INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX order_items_order_idx ON order_items (order_id);

-- ---------- updated_at triggers ----------
CREATE TRIGGER users_updated    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER carts_updated    BEFORE UPDATE ON carts    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER orders_updated   BEFORE UPDATE ON orders   FOR EACH ROW EXECUTE FUNCTION set_updated_at();