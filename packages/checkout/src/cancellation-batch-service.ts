import { Clock, IdSource, orderNotFound } from '../../core/src';
import { JobQueue } from '../../fulfillment/src';
import {
  CancellationBatchInput,
  CancellationBatchRecord,
  CancellationBatchStatus,
} from './cancellation-batch';
import {
  readCancellationBatchPayload,
  readCancellationOrderIds,
} from './cancellation-batch-payload';
import { OrderRepository } from './order-repository';
import { PaymentGateway } from './payment';

/**
 * Separates batch submission from execution so the API can return a tracking ID
 * before payment work starts. The worker and status handler share this instance.
 */
export class CancellationBatchService {
  private readonly batches = new Map<string, CancellationBatchRecord>();

  constructor(
    private readonly orders: OrderRepository,
    private readonly payments: PaymentGateway,
    private readonly queue: JobQueue,
    private readonly clock: Clock,
    private readonly ids: IdSource,
  ) {}

  submit(input: CancellationBatchInput): CancellationBatchStatus {
    if (!input.tenantId.trim() || !input.requestedBy.trim()) {
      throw new Error('tenant and requesting user are required');
    }

    const orderIds = readCancellationOrderIds(input.orderIds);

    for (const orderId of orderIds) {
      if (!this.orders.findForTenant(input.tenantId, orderId)) throw orderNotFound();
    }

    const id = this.ids.next('cancellation-batch');
    const record: CancellationBatchRecord = {
      id,
      tenantId: input.tenantId,
      requestedBy: input.requestedBy,
      submittedAt: this.clock.now(),
      cancelledOrderIds: [],
      skippedOrderIds: [],
      failure: null,
    };

    this.queue.enqueue({ id, eventId: id, payload: { orderIds } });
    this.batches.set(id, record);

    return this.status(input.tenantId, id);
  }

  status(tenantId: string, batchId: string): CancellationBatchStatus {
    const record = this.batches.get(batchId);

    if (!record || record.tenantId !== tenantId) throw new Error('batch not found');

    const job = this.queue.get(batchId);
    const payload = readCancellationBatchPayload(job.payload);

    return {
      id: record.id,
      requestedBy: record.requestedBy,
      submittedAt: record.submittedAt,
      status: job.status,
      orderIds: [...payload.orderIds],
      cancelledOrderIds: [...record.cancelledOrderIds],
      skippedOrderIds: [...record.skippedOrderIds],
      failure: record.failure ? { ...record.failure } : null,
    };
  }

  /** Called by a trusted worker; a payment failure records progress and propagates. */
  process(batchId: string, owner: string): CancellationBatchStatus {
    const record = this.batches.get(batchId);

    if (!record) throw new Error('batch not found');
    if (!owner.trim()) throw new Error('worker owner is required');

    const job = this.queue.claim(batchId, owner, this.clock.now(), 60_000);
    const payload = readCancellationBatchPayload(job.payload);
    record.failure = null;
    this.queue.complete(batchId, owner);

    for (const orderId of payload.orderIds) {
      try {
        const order = this.orders.findForTenant(record.tenantId, orderId);

        if (!order) throw orderNotFound();

        if (order.state === 'cancelled') {
          if (!record.skippedOrderIds.includes(orderId)) record.skippedOrderIds.push(orderId);
          continue;
        }

        this.payments.refund(order.paymentId, order.totalCents);
        order.state = 'cancelled';
        record.cancelledOrderIds.push(orderId);
      } catch (error) {
        record.failure = {
          orderId,
          reason: error instanceof Error ? error.message : 'cancellation failed',
        };
        throw error;
      }
    }

    return this.status(record.tenantId, batchId);
  }
}
