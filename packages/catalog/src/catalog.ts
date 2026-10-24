import { Sku } from '../../core/src';
import { Product } from './product';

export class Catalog {
  private readonly products = new Map<Sku, Product>();

  add(item: Product): void {
    this.products.set(item.sku, item);
  }

  get(sku: Sku): Product | undefined {
    return this.products.get(sku);
  }

  remove(sku: Sku): boolean {
    return this.products.delete(sku);
  }

  list(): Product[] {
    return [...this.products.values()];
  }
}
