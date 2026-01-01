export type Cents = number;

export function assertCents(value: number): Cents {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('invalid cents');
  return value;
}

export function multiplyCents(unitPrice: Cents, quantity: number): Cents {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('invalid quantity');
  return assertCents(unitPrice * quantity);
}

export function discountCents(subtotal: Cents, basisPoints: number): Cents {
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) {
    throw new Error('invalid promotion');
  }
  return Math.floor((subtotal * basisPoints) / 10_000);
}
