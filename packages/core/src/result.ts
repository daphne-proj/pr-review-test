export type Result<T, E extends string> = { ok: true; value: T } | { ok: false; reason: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function fail<E extends string>(reason: E): Result<never, E> {
  return { ok: false, reason };
}
