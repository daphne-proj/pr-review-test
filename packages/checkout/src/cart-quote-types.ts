import { Cents, Sku } from '../../core/src';

export interface CartQuoteLineInput {
  sku: Sku;
  unitPriceCents: Cents;
  quantity: number;
  promotionBps?: number;
}

export interface CartQuoteInput {
  lines: CartQuoteLineInput[];
}

export interface CartQuoteLine {
  sku: Sku;
  unitPriceCents: Cents;
  quantity: number;
  promotionBps: number;
  subtotalCents: Cents;
  discountCents: Cents;
  discountedCents: Cents;
}

export interface CartQuote {
  lines: CartQuoteLine[];
  totalQuantity: number;
  subtotalCents: Cents;
  discountCents: Cents;
  discountedCents: Cents;
  shippingCents: Cents;
  totalCents: Cents;
}
