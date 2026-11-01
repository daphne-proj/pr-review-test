import { CancellationBatchService, CancellationBatchStatus } from '../../../packages/checkout/src';

/** Runs one submitted batch per scheduler invocation using the shared commerce state. */
export class CancellationBatchRunner {
  constructor(
    private readonly batches: CancellationBatchService,
    private readonly owner: string,
  ) {}

  run(batchId: string): CancellationBatchStatus {
    return this.batches.process(batchId, this.owner);
  }
}
