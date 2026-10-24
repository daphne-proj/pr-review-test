import { SupportNoteService } from '../../../packages/checkout/src';
import { Principal, requirePrincipal } from './auth';
import { renderSupportNotes } from './support-note-html';

export class SupportNoteHandler {
  constructor(private readonly notes: SupportNoteService) {}

  create(principal: Principal | undefined, input: unknown) {
    const actor = requirePrincipal(principal);
    return this.notes.create(actor.tenantId, actor.userId, input);
  }

  list(principal: Principal | undefined, query: unknown = {}) {
    const actor = requirePrincipal(principal);
    return this.notes.list(actor.tenantId, query);
  }

  resolve(principal: Principal | undefined, input: unknown) {
    const actor = requirePrincipal(principal);
    return this.notes.resolve(actor.tenantId, actor.userId, input);
  }

  reopen(principal: Principal | undefined, input: unknown) {
    const actor = requirePrincipal(principal);
    return this.notes.reopen(actor.tenantId, actor.userId, input);
  }

  render(principal: Principal | undefined, query: unknown = {}): string {
    return renderSupportNotes(this.list(principal, query));
  }
}
