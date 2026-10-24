interface NoteContent {
  id: string;
  tenantId: string;
  orderId: string;
  authorId: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  revision: number;
}

export type SupportNote = NoteContent &
  (
    | { state: 'open' }
    | { state: 'resolved'; resolvedAt: number; resolvedBy: string }
  );

export interface CreateSupportNote {
  orderId: string;
  body: string;
}

export interface SupportNoteTransition {
  noteId: string;
  expectedRevision: number;
}

export interface SupportNoteQuery {
  orderId?: string;
  state?: SupportNote['state'];
  offset: number;
  limit: number;
}

export interface SupportNotePage {
  notes: SupportNote[];
  offset: number;
  limit: number;
  total: number;
  openCount: number;
  resolvedCount: number;
  nextOffset: number | null;
}
