import { Cents, PaymentId, TenantId } from '../../core/src';

export interface ChargeInput {
  paymentId: PaymentId;
  tenantId: TenantId;
  amountCents: Cents;
}

export interface PaymentAttempt extends ChargeInput {
  state: 'captured' | 'rejected' | 'refunded';
  reason?: string;
}

export interface Refund {
  paymentId: PaymentId;
  amountCents: Cents;
}

export type ChargeResult = { ok: true } | { ok: false; reason: string };

export interface PaymentGateway {
  charge(input: ChargeInput): ChargeResult;
  refund(paymentId: PaymentId, amountCents: Cents): void;
}
