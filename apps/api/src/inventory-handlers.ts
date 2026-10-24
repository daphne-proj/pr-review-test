import {
  Inventory,
  StockAdjustmentService,
} from '../../../packages/catalog/src';
import { Clock } from '../../../packages/core/src';
import { ReservationReportHandler } from './reservation-report-handler';
import { StockAdjustmentHandler } from './stock-adjustment-handler';

export function createInventoryHandlers(inventory: Inventory, clock: Clock) {
  return {
    adjustments: new StockAdjustmentHandler(
      new StockAdjustmentService(inventory),
    ),
    reservations: new ReservationReportHandler(inventory, clock),
  };
}
