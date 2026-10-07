import { CheckoutAttempt } from './checkout-attempt';

export class CheckoutAttemptRepository {
  private readonly values: CheckoutAttempt[] = [];

  start(attempt: CheckoutAttempt): void {
    this.values.push(attempt);
  }

  finish(id: string, state: 'rejected' | 'completed', reason?: string): void {
    const attempt = this.values.find((candidate) => candidate.id === id);
    if (!attempt) throw new Error('checkout attempt not found');
    attempt.state = state;
    attempt.reason = reason;
  }

  all(): CheckoutAttempt[] {
    return this.values.map((attempt) => ({ ...attempt }));
  }
}
