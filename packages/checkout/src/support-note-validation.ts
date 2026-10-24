import type {
  CreateSupportNote,
  SupportNoteQuery,
  SupportNoteTransition,
} from './support-note';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function noteIdentifier(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length > 128 ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    throw new Error('invalid note identifier');
  }

  return value;
}

export function noteTime(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('invalid note timestamp');
  }

  return value;
}

export function readCreateNote(value: unknown): CreateSupportNote {
  if (!record(value)) {
    throw new Error('invalid note request');
  }

  const orderId = noteIdentifier(value.orderId);
  const body = value.body;

  if (
    typeof body !== 'string' ||
    body.trim().length === 0 ||
    body.length > 4_000 ||
    body.includes('\u0000')
  ) {
    throw new Error('invalid note body');
  }

  return { orderId, body };
}

export function readNoteTransition(value: unknown): SupportNoteTransition {
  if (!record(value)) {
    throw new Error('invalid note transition');
  }

  const noteId = noteIdentifier(value.noteId);
  const expectedRevision = value.expectedRevision;

  if (
    typeof expectedRevision !== 'number' ||
    !Number.isSafeInteger(expectedRevision) ||
    expectedRevision < 1
  ) {
    throw new Error('invalid note revision');
  }

  return { noteId, expectedRevision };
}

export function readNoteQuery(value: unknown): SupportNoteQuery {
  if (!record(value)) {
    throw new Error('invalid note query');
  }

  const orderId =
    value.orderId === undefined ? undefined : noteIdentifier(value.orderId);
  const state = value.state;
  const offset = value.offset === undefined ? 0 : value.offset;
  const limit = value.limit === undefined ? 25 : value.limit;

  if (state !== undefined && state !== 'open' && state !== 'resolved') {
    throw new Error('invalid note state');
  }

  if (
    typeof offset !== 'number' ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    throw new Error('invalid note offset');
  }

  if (
    typeof limit !== 'number' ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new Error('invalid note limit');
  }

  return { orderId, state, offset, limit };
}
