import { StockAdjustmentService } from '../../../packages/catalog/src';
import { Principal, requirePrincipal } from './auth';
import {
  parseAdjustmentHistoryQuery,
  parseStockAdjustmentRequest,
} from './stock-adjustment-request';

export class StockAdjustmentHandler {
  constructor(private readonly adjustments: StockAdjustmentService) {}

  handle(principal: Principal | undefined, input: unknown) {
    requirePrincipal(principal);
    const adjustments = parseStockAdjustmentRequest(input);

    return this.adjustments.apply(adjustments);
  }

  history(principal: Principal | undefined, input: unknown = {}) {
    requirePrincipal(principal);
    const query = parseAdjustmentHistoryQuery(input);

    return this.adjustments.history(query);
  }

  find(principal: Principal | undefined, id: unknown) {
    requirePrincipal(principal);

    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('invalid adjustment ID');
    }

    return this.adjustments.find(id);
  }
}
