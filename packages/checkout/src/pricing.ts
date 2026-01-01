import { Cents, assertCents, discountCents, multiplyCents } from '../../core/src';

export interface PriceInput {
  unitPriceCents: Cents;
  quantity: number;
  promotionBps: number;
}

export interface PriceBreakdown {
  subtotalCents: Cents;
  discountCents: Cents;
  shippingCents: Cents;
  totalCents: Cents;
}

const FREE_SHIPPING_CENTS = 5_000;
const SHIPPING_CENTS = 1_000;

export function price(input: PriceInput): PriceBreakdown {
  const subtotalCents = multiplyCents(input.unitPriceCents, input.quantity);
  const promotionDiscount = discountCents(subtotalCents, input.promotionBps);
  const discounted = subtotalCents - promotionDiscount;
  const shippingCents = discounted >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS;
  return {
    subtotalCents,
    discountCents: promotionDiscount,
    shippingCents,
    totalCents: assertCents(discounted + shippingCents),
  };
}
