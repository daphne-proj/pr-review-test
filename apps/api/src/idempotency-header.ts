export function requireIdempotencyKey(headers: Record<string, string | undefined>): string {
  const key = headers['idempotency-key']?.trim();
  if (!key || key.length > 128) throw new Error('invalid idempotency key');
  return key;
}
