CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  payment_id TEXT NOT NULL UNIQUE,
  reservation_id TEXT NOT NULL UNIQUE,
  event_id TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('paid', 'cancelled')),
  placed_at INTEGER NOT NULL
);

CREATE INDEX orders_tenant_placed_at ON orders (tenant_id, placed_at DESC);
