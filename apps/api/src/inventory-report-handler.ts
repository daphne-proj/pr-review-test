import {
  AvailabilityStatus,
  Catalog,
  Inventory,
  InventoryReportRequest,
  exportInventoryReport,
  queryInventoryReport,
} from '../../../packages/catalog/src';
import { Principal, requirePrincipal } from './auth';

function integerParameter(
  query: URLSearchParams,
  name: string,
): number | undefined {
  const values = query.getAll(name);

  if (values.length === 0) {
    return undefined;
  }

  if (values.length !== 1 || !/^\d+$/.test(values[0])) {
    throw new Error(`invalid query parameter: ${name}`);
  }

  const value = Number(values[0]);

  if (!Number.isSafeInteger(value)) {
    throw new Error(`invalid query parameter: ${name}`);
  }

  return value;
}

function reportRequest(query: URLSearchParams): InventoryReportRequest {
  const statuses: AvailabilityStatus[] = [];

  for (const status of query.getAll('status')) {
    if (
      status !== 'available' &&
      status !== 'low_stock' &&
      status !== 'out_of_stock'
    ) {
      throw new Error('invalid availability status');
    }

    statuses.push(status);
  }

  return {
    skus: query.has('sku') ? query.getAll('sku') : undefined,
    statuses: query.has('status') ? statuses : undefined,
    lowStockThreshold: integerParameter(query, 'threshold'),
    targetStock: integerParameter(query, 'target'),
    offset: integerParameter(query, 'offset'),
    limit: integerParameter(query, 'limit'),
  };
}

export class InventoryReportHandler {
  constructor(
    private readonly catalog: Catalog,
    private readonly inventory: Inventory,
  ) {}

  handle(principal: Principal | undefined, query = new URLSearchParams()) {
    requirePrincipal(principal);

    return queryInventoryReport(
      this.catalog,
      this.inventory,
      reportRequest(query),
    );
  }

  download(principal: Principal | undefined, query = new URLSearchParams()) {
    return exportInventoryReport(this.handle(principal, query));
  }
}
