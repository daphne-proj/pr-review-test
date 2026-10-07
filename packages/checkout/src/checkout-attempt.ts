export interface CheckoutAttempt {
  id: string;
  tenantId: string;
  idempotencyKey?: string;
  state: 'started' | 'rejected' | 'completed';
  reason?: string;
}
