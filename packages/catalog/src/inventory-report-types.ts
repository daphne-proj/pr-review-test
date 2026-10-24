import { Sku } from '../../core/src';

export type AvailabilityStatus = 'out_of_stock' | 'low_stock' | 'available';

export interface InventoryReportRequest {
  skus?: Sku[];
  statuses?: AvailabilityStatus[];
  lowStockThreshold?: number;
  targetStock?: number;
  offset?: number;
  limit?: number;
}

export interface InventoryReportRow {
  sku: Sku;
  name: string;
  availableQuantity: number;
  status: AvailabilityStatus;
  recommendedOrderQuantity: number;
}

export interface InventoryReportSummary {
  products: number;
  availableProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  availableUnits: number;
  recommendedOrderUnits: number;
}

export interface InventoryReport {
  rows: InventoryReportRow[];
  summary: InventoryReportSummary;
  lowStockThreshold: number;
  targetStock: number;
  offset: number;
  limit: number;
  nextOffset: number | null;
}
