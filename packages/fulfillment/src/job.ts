export interface DeliveryJob {
  id: string;
  eventId: string;
  payload: unknown;
  status: 'pending' | 'leased' | 'complete';
  leaseOwner?: string;
  leaseUntil?: number;
}

export type NewDeliveryJob = Pick<DeliveryJob, 'id' | 'eventId' | 'payload'>;
