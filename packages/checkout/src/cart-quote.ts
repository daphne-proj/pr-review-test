import { assertCents } from '../../core/src';
import { CartQuote, CartQuoteInput, CartQuoteLine } from './cart-quote-types';
import { priceMerchandise, shippingFor } from './pricing';

const MAX_CART_LINES = 100;

export function assertCartLineCount(count: number): void {
  if (!Number.isSafeInteger(count) || count <= 0 || count > MAX_CART_LINES) {
    throw new Error('cart must contain between 1 and 100 lines');
  }
}

export function quoteCart(input: CartQuoteInput): CartQuote {
  assertCartLineCount(input.lines.length);

  const lines: CartQuoteLine[] = [];
  let totalQuantity = 0;
  let subtotalCents = 0;
  let discountCents = 0;
  let discountedCents = 0;

  for (const item of input.lines) {
    if (item.sku.trim().length === 0) {
      throw new Error('invalid quote SKU');
    }

    const promotionBps = item.promotionBps ?? 0;
    const merchandise = priceMerchandise({
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      promotionBps,
    });

    totalQuantity += item.quantity;

    if (!Number.isSafeInteger(totalQuantity)) {
      throw new Error('cart quantity exceeds safe integer range');
    }

    subtotalCents = assertCents(subtotalCents + merchandise.subtotalCents);
    discountCents = assertCents(discountCents + merchandise.discountCents);
    discountedCents = assertCents(
      discountedCents + merchandise.discountedCents,
    );
    lines.push({
      sku: item.sku,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      promotionBps,
      ...merchandise,
    });
  }

  const shippingCents = shippingFor(discountedCents);
  const totalCents = assertCents(discountedCents + shippingCents);

  return {
    lines,
    totalQuantity,
    subtotalCents,
    discountCents,
    discountedCents,
    shippingCents,
    totalCents,
  };
}
