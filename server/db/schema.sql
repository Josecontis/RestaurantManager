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
