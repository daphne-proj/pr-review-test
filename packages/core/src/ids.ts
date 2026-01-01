export interface IdSource {
  next(kind: string): string;
}

export function sequenceIds(prefix: string): IdSource {
  const counters = new Map<string, number>();
  return {
    next(kind: string): string {
      const next = (counters.get(kind) ?? 0) + 1;
      counters.set(kind, next);
      return `${prefix}-${kind}-${next}`;
    },
  };
}
