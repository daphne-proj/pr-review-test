import {
  CartQuoteInput,
  CartQuoteLineInput,
  CheckoutService,
  PlaceOrderInput,
  assertCartLineCount,
  quoteCart,
} from '../../../packages/checkout/src';
import { Principal, requirePrincipal } from './auth';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function quoteRequest(value: unknown): CartQuoteInput {
  if (!isRecord(value)) {
    throw new Error('invalid quote request');
  }

  const request = value;

  if (!Array.isArray(request.lines)) {
    throw new Error('invalid quote lines');
  }

  assertCartLineCount(request.lines.length);

  const lines: CartQuoteLineInput[] = [];

  for (const value of request.lines) {
    if (!isRecord(value)) {
      throw new Error('invalid quote line');
    }

    const line = value;

    if (
      typeof line.sku !== 'string' ||
      typeof line.unitPriceCents !== 'number' ||
      typeof line.quantity !== 'number' ||
      (line.promotionBps !== undefined && typeof line.promotionBps !== 'number')
    ) {
      throw new Error('invalid quote line fields');
    }

    lines.push({
      sku: line.sku,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
      promotionBps: line.promotionBps,
    });
  }

  return { lines };
}

export class CheckoutHandler {
  constructor(private readonly checkout: CheckoutService) {}

  handle(
    principal: Principal | undefined,
    input: Omit<PlaceOrderInput, 'tenantId'>,
  ) {
    const actor = requirePrincipal(principal);
    return this.checkout.place({ ...input, tenantId: actor.tenantId });
  }

  quote(principal: Principal | undefined, input: unknown) {
    requirePrincipal(principal);

    return quoteCart(quoteRequest(input));
  }
}
