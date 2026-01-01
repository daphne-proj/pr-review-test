export interface Principal {
  tenantId: string;
  userId: string;
}

export function requirePrincipal(value: Principal | undefined): Principal {
  if (!value) throw new Error('unauthorized');
  return value;
}
