-- Test discount codes for development. Codes are stored in UPPERCASE.
-- Run: psql "$DATABASE_URL" -f src/db/seed-discounts.sql

INSERT INTO discount_codes (code, type, value, expires_at, usage_limit, times_used, is_active) VALUES
  ('WELCOME10', 'percent', 10,  NULL,                      NULL, 0, true),   -- 10% off, no limit
  ('BUNA5',     'fixed',   500, NULL,                      NULL, 0, true),   -- 5.00 off (500 cents)
  ('BIGOFF',    'fixed',   99999, NULL,                    NULL, 0, true),   -- bigger than any cart: must be capped
  ('EXPIRED20', 'percent', 20,  now() - interval '1 day',  NULL, 0, true),   -- expired
  ('USEDUP',    'percent', 15,  NULL,                      1,    1, true),   -- usage limit reached
  ('DISABLED',  'percent', 25,  NULL,                      NULL, 0, false)   -- switched off
ON CONFLICT (code) DO NOTHING; 



