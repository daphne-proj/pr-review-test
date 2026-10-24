export interface NewDeliveryJob {
  id: string;
  eventId: string;
  payload: unknown;
  availableAt?: number;
}

export interface DeliveryJobDetails {
  readonly id: string;
  readonly eventId: string;
  readonly payload: unknown;
  readonly createdAt: number;
  readonly attempts: number;
  readonly leaseGeneration: number;
  readonly lastError?: string;
}

export interface PendingDeliveryJob extends DeliveryJobDetails {
  readonly status: 'pending';
  readonly availableAt: number;
}

export interface ClaimedDeliveryJob extends DeliveryJobDetails {
  readonly status: 'leased';
  readonly leaseOwner: string;
  readonly leaseUntil: number;
  readonly claimedAt: number;
}

export interface CompletedDeliveryJob extends DeliveryJobDetails {
  readonly status: 'complete';
  readonly completedAt: number;
}

export interface ExhaustedDeliveryJob extends DeliveryJobDetails {
  readonly status: 'exhausted';
  readonly exhaustedAt: number;
  readonly lastError: string;
}

export type DeliveryJob =
  | PendingDeliveryJob
  | ClaimedDeliveryJob
  | CompletedDeliveryJob
  | ExhaustedDeliveryJob;

export type DeliverySender = (job: ClaimedDeliveryJob) => void | Promise<void>;
