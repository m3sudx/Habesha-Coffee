-- Habesha Coffee schema (PostgreSQL 14+)


-- 0. RESET (dev only)
DROP TABLE IF EXISTS order_items, orders, discount_codes, cart_items, carts,
                     product_variants, products, categories, users CASCADE;
DROP TYPE IF EXISTS order_status, discount_type, user_role;
DROP FUNCTION IF EXISTS set_updated_at();

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE discount_type AS ENUM ('percent', 'fixed');

-- 2. updated_at TRIGGER FUNCTION
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABLES

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email = lower(email)),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    origin_info VARCHAR(255),
    roast_info VARCHAR(255),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category_id ON products(category_id);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    size_grams INTEGER NOT NULL CHECK (size_grams > 0),
    grind VARCHAR(100) NOT NULL DEFAULT 'whole bean',
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, size_grams, grind)
);
-- UNIQUE (product_id, ...) already indexes product_id, so no extra index needed.

CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);
-- One cart per user and one cart per guest session.
CREATE UNIQUE INDEX uq_carts_user ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_carts_session ON carts(session_id) WHERE session_id IS NOT NULL;

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cart_id, variant_id)
);
-- UNIQUE (cart_id, ...) already indexes cart_id.
CREATE INDEX idx_cart_items_variant_id ON cart_items(variant_id);

CREATE TABLE discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    type discount_type NOT NULL,
    value INTEGER NOT NULL CHECK (value > 0),
    expires_at TIMESTAMPTZ,
    usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
    times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (type <> 'percent' OR value <= 100)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Nullable only so an order survives if the user is deleted.
    -- Checkout requires login, enforced in the API.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'pending',
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    discount_code_id UUID REFERENCES discount_codes(id) ON DELETE SET NULL,
    stripe_session_id VARCHAR(255) UNIQUE,

    shipping_name VARCHAR(255) NOT NULL,
    shipping_phone VARCHAR(50) NOT NULL,
    shipping_street VARCHAR(255) NOT NULL,
    shipping_city VARCHAR(255) NOT NULL,
    shipping_state VARCHAR(255),
    shipping_zip VARCHAR(50),
    shipping_country VARCHAR(100) NOT NULL,

    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (discount_cents <= subtotal_cents),
    CHECK (total_cents = subtotal_cents - discount_cents)
);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_discount_code_id ON orders(discount_code_id);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    -- Snapshot of what was bought, so old orders stay correct if the product changes.
    product_name VARCHAR(255) NOT NULL,
    variant_label VARCHAR(255) NOT NULL,
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

-- 4. updated_at TRIGGERS
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_product_variants_updated BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_carts_updated BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cart_items_updated BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_discount_codes_updated BEFORE UPDATE ON discount_codes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();