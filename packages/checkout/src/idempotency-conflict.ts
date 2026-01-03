export class IdempotencyConflict extends Error {
  readonly code = 'idempotency_conflict';

  constructor(readonly key: string) {
    super('idempotency key was already used for a different request');
  }
}
