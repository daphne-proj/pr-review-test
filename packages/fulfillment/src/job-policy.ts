export interface JobPolicy {
  readonly leaseDurationMs: number;
  readonly maxAttempts: number;
  readonly retryDelayMs: number;
  readonly maxRetryDelayMs: number;
}

const DEFAULT_JOB_POLICY: JobPolicy = {
  leaseDurationMs: 30_000,
  maxAttempts: 3,
  retryDelayMs: 1_000,
  maxRetryDelayMs: 60_000,
};

export function resolveJobPolicy(overrides: Partial<JobPolicy>): JobPolicy {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error('invalid job policy');
  }

  const policy = { ...DEFAULT_JOB_POLICY, ...overrides };

  for (const value of [
    policy.leaseDurationMs,
    policy.maxAttempts,
    policy.retryDelayMs,
    policy.maxRetryDelayMs,
  ]) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error('invalid job policy');
    }
  }

  if (policy.maxRetryDelayMs < policy.retryDelayMs) {
    throw new Error('maximum retry delay is below initial delay');
  }

  return Object.freeze(policy);
}

export function retryAvailableAt(
  now: number,
  attempts: number,
  policy: JobPolicy,
): number {
  /* Capping the exponent avoids overflow before the configured delay cap. */
  const multiplier = 2 ** Math.min(attempts - 1, 53);
  const delay = Math.min(
    policy.maxRetryDelayMs,
    policy.retryDelayMs * multiplier,
  );
  const availableAt = now + delay;

  if (!Number.isFinite(availableAt) || availableAt <= now) {
    throw new Error('invalid retry deadline');
  }

  return availableAt;
}
