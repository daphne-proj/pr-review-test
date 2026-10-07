INSERT INTO orders (id, tenant_id, customer_id, sku, quantity, total_cents, payment_id, reservation_id, event_id, state, placed_at)
VALUES
  ('seed-order-1', 'acme', 'customer-1', 'widget', 2, 5000, 'seed-payment-1', 'seed-reservation-1', 'seed-event-1', 'paid', 1798761600000),
  ('seed-order-2', 'acme', 'customer-2', 'gadget', 1, 3200, 'seed-payment-2', 'seed-reservation-2', 'seed-event-2', 'cancelled', 1798848000000);
