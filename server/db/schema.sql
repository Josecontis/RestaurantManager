-- Every statement can run more than once: the server executes this file at startup

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dishes (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories (id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(8, 2) NOT NULL CHECK (price >= 0),
  allergens TEXT NOT NULL DEFAULT '',
  ingredients TEXT,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS tablets (
  id SERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL CHECK (table_number > 0),
  code_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pickup and delivery hours, one row per weekday: 1 = Monday ... 7 = Sunday
CREATE TABLE IF NOT EXISTS opening_hours (
  weekday INTEGER PRIMARY KEY CHECK (weekday BETWEEN 1 AND 7),
  is_open BOOLEAN NOT NULL DEFAULT true,
  first_slot TIME NOT NULL DEFAULT '19:00',
  last_slot TIME NOT NULL DEFAULT '23:00',
  CHECK (first_slot <= last_slot)
);

INSERT INTO opening_hours (weekday)
SELECT generate_series(1, 7)
ON CONFLICT DO NOTHING;

-- Each driver on duty takes one delivery per slot
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_type TEXT NOT NULL CHECK (order_type IN ('sul_posto', 'ritiro', 'consegna')),
  tablet_id INTEGER REFERENCES tablets (id) ON DELETE SET NULL,
  table_number INTEGER,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  -- Pickup or delivery time, empty for orders eaten at the table
  scheduled_at TIMESTAMPTZ,
  driver_id INTEGER REFERENCES drivers (id) ON DELETE SET NULL,
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kitchen progress of an order; ALTER so databases created before this column also get it
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'nuovo'
  CHECK (status IN ('nuovo', 'in_preparazione', 'pronto', 'completato'));

-- Where a delivery goes and what it costs, saved when the order arrives
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_lat DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_lon DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_km NUMERIC(5, 1);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(8, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  dish_id INTEGER NOT NULL REFERENCES dishes (id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(8, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Restaurant settings changed from the admin area, always one row
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  -- Kitchen capacity: a quarter of it in each 15 minute slot
  pizzas_per_hour INTEGER NOT NULL DEFAULT 24 CHECK (pizzas_per_hour BETWEEN 4 AND 400),
  -- Pickup and delivery only: a big table can always order
  max_dishes_per_order INTEGER NOT NULL DEFAULT 10 CHECK (max_dishes_per_order BETWEEN 1 AND 100),
  -- Pickup and delivery orders a phone number can place in one day
  max_orders_per_phone INTEGER NOT NULL DEFAULT 3 CHECK (max_orders_per_phone BETWEEN 1 AND 50)
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Delivery: pizzeria position (empty until the admin sets it), zone radius in a
-- straight line, minimum order without the fee, fee bands sorted by distance:
-- [{ "upToKm": 3, "fee": 2 }, ...], the last band also covers the rest of the zone
ALTER TABLE settings ADD COLUMN IF NOT EXISTS pizzeria_address TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS pizzeria_lat DOUBLE PRECISION;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS pizzeria_lon DOUBLE PRECISION;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS delivery_radius_km NUMERIC(4, 1) NOT NULL DEFAULT 5;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS delivery_min_order NUMERIC(8, 2) NOT NULL DEFAULT 10;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS delivery_fees JSONB NOT NULL
  DEFAULT '[{"upToKm": 3, "fee": 2}, {"upToKm": 5, "fee": 3}]';

-- Look of the site, the same code for any restaurant: name, main color and logo
ALTER TABLE settings ADD COLUMN IF NOT EXISTS restaurant_name TEXT NOT NULL DEFAULT 'Wellness Pizza';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#ec7d6a'
  CHECK (accent_color ~ '^#[0-9a-f]{6}$');
ALTER TABLE settings ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Logo and dish photos, already made smaller by the browser.
-- key is "logo" or "dish-<id>"; replacing a photo overwrites its row.
CREATE TABLE IF NOT EXISTS images (
  key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  data BYTEA NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
