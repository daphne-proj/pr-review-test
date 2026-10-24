export type Cents = number;

export function assertCents(value: number): Cents {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('invalid cents');
  }

  return value;
}

export function multiplyCents(unitPrice: Cents, quantity: number): Cents {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error('invalid quantity');
  }

  assertCents(unitPrice);

  return assertCents(unitPrice * quantity);
}

export function discountCents(subtotal: Cents, basisPoints: number): Cents {
  assertCents(subtotal);

  if (
    !Number.isInteger(basisPoints) ||
    basisPoints < 0 ||
    basisPoints > 10_000
  ) {
    throw new Error('invalid promotion');
  }

  /* The intermediate product can exceed the safe range even for a valid subtotal. */
  return Number((BigInt(subtotal) * BigInt(basisPoints)) / 10_000n);
}
