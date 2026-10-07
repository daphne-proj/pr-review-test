import { PlaceOrderResult } from './checkout-service';

export interface IdempotencyRecord {
  tenantId: string;
  key: string;
  requestFingerprint: string;
  result: PlaceOrderResult;
  recordedAt: number;
}
