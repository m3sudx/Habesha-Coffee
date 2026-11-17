# Habesha Coffee

A full-stack e-commerce store for a fictional Ethiopian specialty coffee roaster. Customers browse beans, pick size and grind variants, check out with Stripe, and track orders. The shop owner manages products, orders and discount codes from an admin dashboard.


<!--screenshot or GIF -->

## Features

**Storefront**
- Product listing with search, filters and sorting
- Product pages with variants (for example 250g whole bean, 1kg ground) and stock status
- Guest cart that merges into the user's cart on login
- Discount codes at checkout
- Stripe Checkout (test mode) and order confirmation email
- Register, login and order history

**Admin**
- Product and variant management with image upload
- Order management and status updates
- Discount codes (percent or fixed, expiry, usage limit)
- Sales overview

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | typescript+Next.js, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT, bcrypt, role-based access (customer, admin) |
| Payments | Stripe Checkout and webhooks |
| Email | Nodemailer |

## Project structure

```
habesha-coffee/
  client/            neext.js storefront and admin UI
  server/
    src/
      config/        env and database connection
      db/            schema.sql, seed.js, migrations
      routes/        route definitions
      controllers/   request handlers
      middleware/    auth, role check, validation, upload, errors
      services/      stripe, email, pricing logic
      utils/         helpers (asyncHandler, ApiError, tokens)
      app.js         Express app
      server.js      entry point
    uploads/         product images (git-ignored)
    docs/        
    logo/            logo files
    screenshots/
```

## Getting started

### Prerequisites
- Node.js 20 or newer
- PostgreSQL 14 or newer
- A Stripe account (test mode) for payments

### 1. Clone and install

```bash
git clone https://github.com/<m3sudx>/habesha-coffee.git
cd habesha-coffee

cd server && npm install
cd ../client && npm install
```

### 2. Configure the environment

Fill in `DATABASE_URL`, `JWT_SECRET` and your Stripe keys.

### 3. Set up the database

```bash
createdb habesha_coffee
npm run db:schema    # creates the tables
npm run db:seed      # adds sample products
```

### 4. Run the app

```bash
# terminal 1
cd server && npm run dev      # http://localhost:5000

# terminal 2
cd client && npm run dev      # http://localhost:3000
```

### Stripe webhook (local)

```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

Copy the signing secret it prints into `STRIPE_WEBHOOK_SECRET`.

## Design notes

- Prices are stored in cents to avoid floating-point errors.
- Order items copy the product name and price at purchase time, so past orders stay correct if a product changes later.
- Stock is reduced only after the Stripe webhook confirms payment.
- Admin routes are protected by role middleware, not just hidden in the UI.

## Roadmap

- [ ] Phase 1: core store (auth, products, cart, checkout, admin orders)
- [ ] Saved addresses and order tracking page
- [ ] Reviews and wish list
- [ ] Local payment gateway integration

## License

