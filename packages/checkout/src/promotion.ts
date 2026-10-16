import type { Cents } from '../../core/src';

export function discountCents(subtotal: Cents, basisPoints: number): Cents {
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) {
    throw new Error('invalid promotion');
  }
  return Math.floor((subtotal * basisPoints) / 10_000);
}
