export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function orderNotFound(): DomainError {
  return new DomainError('order_not_found', 'order not found');
}
