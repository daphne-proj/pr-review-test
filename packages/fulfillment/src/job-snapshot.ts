import { DeliveryJob, DeliveryJobDetails } from './job';

function assertOwnedPayload(value: unknown, visited: Set<object>): void {
  if (value === null || typeof value !== 'object') {
    return;
  }

  if (
    value instanceof SharedArrayBuffer ||
    (ArrayBuffer.isView(value) && value.buffer instanceof SharedArrayBuffer)
  ) {
    throw new Error('shared memory is not supported in job payloads');
  }

  if (
    ArrayBuffer.isView(value) ||
    value instanceof ArrayBuffer ||
    value instanceof Date ||
    value instanceof RegExp ||
    visited.has(value)
  ) {
    return;
  }

  visited.add(value);

  if (value instanceof Map) {
    for (const [key, entry] of value) {
      assertOwnedPayload(key, visited);
      assertOwnedPayload(entry, visited);
    }

    return;
  }

  if (value instanceof Set) {
    for (const entry of value) {
      assertOwnedPayload(entry, visited);
    }

    return;
  }

  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error('unsupported job payload object');
  }

  for (const entry of Object.values(value)) {
    assertOwnedPayload(entry, visited);
  }
}

export function cloneJobPayload(payload: unknown): unknown {
  /* Validate the clone so getters cannot substitute shared memory on a second read. */
  const cloned = structuredClone(payload);
  assertOwnedPayload(cloned, new Set());

  return cloned;
}

export function jobDetails(job: DeliveryJob): DeliveryJobDetails {
  return {
    id: job.id,
    eventId: job.eventId,
    payload: job.payload,
    createdAt: job.createdAt,
    attempts: job.attempts,
    leaseGeneration: job.leaseGeneration,
    lastError: job.lastError,
  };
}

export function snapshotJob<T extends DeliveryJob>(job: T): T {
  /* Sender edits to nested payloads must not change retained queue state. */
  return { ...job, payload: cloneJobPayload(job.payload) };
}
