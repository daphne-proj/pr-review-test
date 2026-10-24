import {
  Cents,
  assertCents,
  discountCents,
  multiplyCents,
} from '../../core/src';

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

export interface MerchandisePrice {
  subtotalCents: Cents;
  discountCents: Cents;
  discountedCents: Cents;
}

const FREE_SHIPPING_CENTS = 5_000;
const SHIPPING_CENTS = 1_000;

export function priceMerchandise(input: PriceInput): MerchandisePrice {
  const subtotalCents = multiplyCents(input.unitPriceCents, input.quantity);
  const promotionDiscount = discountCents(subtotalCents, input.promotionBps);

  return {
    subtotalCents,
    discountCents: promotionDiscount,
    discountedCents: subtotalCents - promotionDiscount,
  };
}

export function shippingFor(discountedCents: Cents): Cents {
  assertCents(discountedCents);

  return discountedCents >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS;
}

export function price(input: PriceInput): PriceBreakdown {
  const merchandise = priceMerchandise(input);
  const shippingCents = shippingFor(merchandise.discountedCents);

  return {
    subtotalCents: merchandise.subtotalCents,
    discountCents: merchandise.discountCents,
    shippingCents,
    totalCents: assertCents(merchandise.discountedCents + shippingCents),
  };
}
