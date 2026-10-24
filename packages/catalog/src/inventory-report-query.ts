import { Catalog } from './catalog';
import { Inventory } from './inventory';
import {
  AvailabilityStatus,
  InventoryReport,
  InventoryReportRequest,
  InventoryReportRow,
  InventoryReportSummary,
} from './inventory-report-types';

function assertCount(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`invalid ${name}`);
  }
}

function statusFor(quantity: number, threshold: number): AvailabilityStatus {
  if (quantity === 0) {
    return 'out_of_stock';
  }

  return quantity <= threshold ? 'low_stock' : 'available';
}

export function queryInventoryReport(
  catalog: Catalog,
  inventory: Inventory,
  request: InventoryReportRequest = {},
): InventoryReport {
  const lowStockThreshold = request.lowStockThreshold ?? 5;
  const targetStock = request.targetStock ?? 20;
  const offset = request.offset ?? 0;
  const limit = request.limit ?? 50;

  assertCount(lowStockThreshold, 'low-stock threshold');
  assertCount(targetStock, 'target stock');
  assertCount(offset, 'report offset');
  assertCount(limit, 'report limit');

  if (targetStock <= lowStockThreshold || limit === 0 || limit > 200) {
    throw new Error('invalid report bounds');
  }

  for (const sku of request.skus ?? []) {
    if (sku.trim().length === 0 || !catalog.get(sku)) {
      throw new Error(`unknown report SKU: ${sku}`);
    }
  }

  for (const status of request.statuses ?? []) {
    if (!['out_of_stock', 'low_stock', 'available'].includes(status)) {
      throw new Error('invalid availability status');
    }
  }

  const skus = request.skus === undefined ? undefined : new Set(request.skus);
  const statuses =
    request.statuses === undefined ? undefined : new Set(request.statuses);
  const rows: InventoryReportRow[] = [];

  for (const product of catalog.list()) {
    if (skus && !skus.has(product.sku)) {
      continue;
    }

    const availableQuantity = inventory.available(product.sku);
    assertCount(availableQuantity, 'available stock');
    const status = statusFor(availableQuantity, lowStockThreshold);

    if (statuses && !statuses.has(status)) {
      continue;
    }

    rows.push({
      sku: product.sku,
      name: product.name,
      availableQuantity,
      status,
      recommendedOrderQuantity:
        status === 'available' ? 0 : targetStock - availableQuantity,
    });
  }

  rows.sort((left, right) => {
    if (left.sku < right.sku) {
      return -1;
    }

    return left.sku > right.sku ? 1 : 0;
  });

  const summary: InventoryReportSummary = {
    products: rows.length,
    availableProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    availableUnits: 0,
    recommendedOrderUnits: 0,
  };

  for (const row of rows) {
    if (row.status === 'available') {
      summary.availableProducts += 1;
    } else if (row.status === 'low_stock') {
      summary.lowStockProducts += 1;
    } else {
      summary.outOfStockProducts += 1;
    }

    summary.availableUnits += row.availableQuantity;
    summary.recommendedOrderUnits += row.recommendedOrderQuantity;
    assertCount(summary.availableUnits, 'available unit total');
    assertCount(summary.recommendedOrderUnits, 'recommended order total');
  }

  const pageRows = rows.slice(offset, offset + limit);

  return {
    rows: pageRows,
    summary,
    lowStockThreshold,
    targetStock,
    offset,
    limit,
    nextOffset:
      offset + pageRows.length < rows.length ? offset + pageRows.length : null,
  };
}
