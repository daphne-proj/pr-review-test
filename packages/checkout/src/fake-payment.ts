import { Cents, PaymentId } from '../../core/src';
import { ChargeInput, ChargeResult, PaymentAttempt, PaymentGateway, Refund } from './payment';

export class FakePaymentGateway implements PaymentGateway {
  private readonly paymentAttempts: PaymentAttempt[] = [];
  private readonly paymentRefunds: Refund[] = [];
  private nextRejection?: string;

  rejectNext(reason: string): void {
    this.nextRejection = reason;
  }

  charge(input: ChargeInput): ChargeResult {
    if (this.nextRejection) {
      const reason = this.nextRejection;
      this.nextRejection = undefined;
      this.paymentAttempts.push({ ...input, state: 'rejected', reason });
      return { ok: false, reason };
    }
    this.paymentAttempts.push({ ...input, state: 'captured' });
    return { ok: true };
  }

  refund(paymentId: PaymentId, amountCents: Cents): void {
    const payment = this.paymentAttempts.find((attempt) => attempt.paymentId === paymentId);
    if (!payment || payment.state !== 'captured') throw new Error('payment not captured');
    const alreadyRefunded = this.paymentRefunds
      .filter((refund) => refund.paymentId === paymentId)
      .reduce((total, refund) => total + refund.amountCents, 0);
    if (alreadyRefunded + amountCents > payment.amountCents) throw new Error('refund exceeds capture');
    this.paymentRefunds.push({ paymentId, amountCents });
    payment.state = 'refunded';
  }

  attempts(): PaymentAttempt[] {
    return [...this.paymentAttempts];
  }

  refunds(): Refund[] {
    return [...this.paymentRefunds];
  }
}
