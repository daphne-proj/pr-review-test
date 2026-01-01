import { Cents, Sku, assertCents } from '../../core/src';

export interface Product {
  sku: Sku;
  name: string;
  unitPriceCents: Cents;
}

export function product(sku: Sku, name: string, unitPriceCents: number): Product {
  return { sku, name, unitPriceCents: assertCents(unitPriceCents) };
}
