import {
  Inventory,
  ReservationQuery,
  reservationReport,
  validateReservationQuery,
} from '../../../packages/catalog/src';
import { Clock } from '../../../packages/core/src';
import { Principal, requirePrincipal } from './auth';

function parseReservationQuery(value: unknown): ReservationQuery {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('invalid reservation query');
  }

  if (
    Object.keys(value).some(
      (key) => !['sku', 'state', 'expiresAtOrBefore'].includes(key),
    )
  ) {
    throw new Error('unknown reservation filter');
  }

  const query: ReservationQuery = {};

  if ('sku' in value) {
    if (typeof value.sku !== 'string') {
      throw new Error('invalid reservation SKU');
    }

    query.sku = value.sku;
  }

  if ('state' in value) {
    if (
      value.state !== 'active' &&
      value.state !== 'committed' &&
      value.state !== 'released'
    ) {
      throw new Error('invalid reservation state');
    }

    query.state = value.state;
  }

  if ('expiresAtOrBefore' in value) {
    if (typeof value.expiresAtOrBefore !== 'number') {
      throw new Error('invalid reservation expiry cutoff');
    }

    query.expiresAtOrBefore = value.expiresAtOrBefore;
  }

  validateReservationQuery(query);

  return query;
}

export class ReservationReportHandler {
  constructor(
    private readonly inventory: Inventory,
    private readonly clock: Clock,
  ) {}

  handle(principal: Principal | undefined, input: unknown = {}) {
    requirePrincipal(principal);
    const query = parseReservationQuery(input);

    return reservationReport(this.inventory, this.clock.now(), query);
  }
}
