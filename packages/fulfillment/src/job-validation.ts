export function assertJobIdentifier(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`invalid ${label}`);
  }
}

export function assertJobTime(now: number): void {
  if (!Number.isFinite(now)) {
    throw new Error('invalid job time');
  }
}

export function leaseDeadline(now: number, duration: number): number {
  assertJobTime(now);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('invalid lease duration');
  }

  const deadline = now + duration;

  if (!Number.isFinite(deadline) || deadline <= now) {
    throw new Error('invalid lease deadline');
  }

  return deadline;
}

export function assertLeaseCredentials(
  owner: string,
  generation: number,
  now: number,
): void {
  assertJobIdentifier(owner, 'lease owner');
  assertJobTime(now);

  if (!Number.isSafeInteger(generation) || generation <= 0) {
    throw new Error('invalid lease generation');
  }
}

export function assertFailureReason(reason: string): void {
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    throw new Error('invalid job failure reason');
  }
}
