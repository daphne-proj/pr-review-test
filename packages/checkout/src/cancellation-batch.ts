export const maximumCancellationBatchSize = 20;

export interface CancellationBatchInput {
  tenantId: string;
  requestedBy: string;
  orderIds: string[];
}

export interface CancellationBatchFailure {
  orderId: string;
  reason: string;
}

/** Reports a queued selection and the progress of its background cancellation. */
export interface CancellationBatchStatus {
  id: string;
  requestedBy: string;
  submittedAt: number;
  status: 'pending' | 'leased' | 'complete';
  orderIds: string[];
  cancelledOrderIds: string[];
  skippedOrderIds: string[];
  failure: CancellationBatchFailure | null;
}

/** Internal progress belongs to one tenant; status responses copy its mutable fields. */
export interface CancellationBatchRecord {
  id: string;
  tenantId: string;
  requestedBy: string;
  submittedAt: number;
  cancelledOrderIds: string[];
  skippedOrderIds: string[];
  failure: CancellationBatchFailure | null;
}
