import { ReservationId, Sku } from '../../core/src';

export type ReservationState = 'active' | 'released' | 'committed';

export interface Reservation {
  id: ReservationId;
  sku: Sku;
  quantity: number;
  expiresAt: number;
  state: ReservationState;
}

export interface ReserveInput {
  id: ReservationId;
  sku: Sku;
  quantity: number;
  expiresAt: number;
}
