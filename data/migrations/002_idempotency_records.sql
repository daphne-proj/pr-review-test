CREATE TABLE idempotency_records (
  tenant_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  result_json TEXT NOT NULL,
  recorded_at INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, idempotency_key)
);
