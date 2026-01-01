import { ReservationId, Sku } from '../../core/src';

export interface Reservation {
  id: ReservationId;
  sku: Sku;
  quantity: number;
  expiresAt: number;
  state: 'active' | 'released' | 'committed';
}

export interface ReserveInput {
  id: ReservationId;
  sku: Sku;
  quantity: number;
  expiresAt: number;
}
