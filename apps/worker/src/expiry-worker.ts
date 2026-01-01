import { Inventory, Reservation } from '../../../packages/catalog/src';

export class ExpiryWorker {
  constructor(private readonly inventory: Inventory) {}

  run(now: number): Reservation[] {
    return this.inventory.expire(now);
  }
}
