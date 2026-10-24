import type { Clock, IdSource } from '../../core/src';
import { OrderRepository } from './order-repository';
import type { SupportNote, SupportNotePage } from './support-note';
import { querySupportNotes } from './support-note-query';
import { SupportNoteRepository } from './support-note-repository';
import {
  noteIdentifier,
  noteTime,
  readCreateNote,
  readNoteQuery,
  readNoteTransition,
} from './support-note-validation';

export class SupportNoteService {
  constructor(
    private readonly notes: SupportNoteRepository,
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
    private readonly ids: IdSource,
  ) {}

  create(tenantId: string, authorId: string, input: unknown): SupportNote {
    noteIdentifier(tenantId);
    noteIdentifier(authorId);
    const request = readCreateNote(input);

    if (this.orders.findForTenant(tenantId, request.orderId) === undefined) {
      throw new Error('order not found');
    }

    const now = noteTime(this.clock.now());
    const id = noteIdentifier(this.ids.next('support-note'));
    const note: SupportNote = {
      id,
      tenantId,
      orderId: request.orderId,
      authorId,
      body: request.body,
      createdAt: now,
      updatedAt: now,
      revision: 1,
      state: 'open',
    };

    this.notes.insert(note);
    return { ...note };
  }

  list(tenantId: string, input: unknown = {}): SupportNotePage {
    noteIdentifier(tenantId);
    const query = readNoteQuery(input);
    return querySupportNotes(this.notes.all(tenantId), query);
  }

  resolve(tenantId: string, actorId: string, input: unknown): SupportNote {
    return this.transition(tenantId, actorId, input, 'resolved');
  }

  reopen(tenantId: string, actorId: string, input: unknown): SupportNote {
    return this.transition(tenantId, actorId, input, 'open');
  }

  private transition(
    tenantId: string,
    actorId: string,
    input: unknown,
    state: SupportNote['state'],
  ): SupportNote {
    noteIdentifier(tenantId);
    noteIdentifier(actorId);
    const request = readNoteTransition(input);
    const current = this.notes.find(tenantId, request.noteId);

    if (current === undefined) {
      throw new Error('note not found');
    }

    if (current.revision !== request.expectedRevision) {
      throw new Error('note revision conflict');
    }

    if (current.state === state) {
      return current;
    }

    const now = noteTime(this.clock.now());

    if (
      now < current.updatedAt ||
      current.revision === Number.MAX_SAFE_INTEGER
    ) {
      throw new Error('invalid note transition time or revision');
    }

    const content = {
      id: current.id,
      tenantId: current.tenantId,
      orderId: current.orderId,
      authorId: current.authorId,
      body: current.body,
      createdAt: current.createdAt,
      updatedAt: now,
      revision: current.revision + 1,
    };
    const next: SupportNote =
      state === 'open'
        ? { ...content, state: 'open' }
        : {
            ...content,
            state: 'resolved',
            resolvedAt: now,
            resolvedBy: actorId,
          };

    this.notes.replace(next, current.revision);
    return { ...next };
  }
}
