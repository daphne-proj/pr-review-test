import { Inventory } from './inventory';

export function lowStock(inventory: Inventory, skus: string[], threshold: number): string[] {
  return skus.filter((sku) => inventory.available(sku) <= threshold);
}
