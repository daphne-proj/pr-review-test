import type {
  SupportNote,
  SupportNotePage,
  SupportNoteQuery,
} from './support-note';

export function querySupportNotes(
  notes: SupportNote[],
  query: SupportNoteQuery,
): SupportNotePage {
  const matching = notes.filter(
    (note) =>
      (query.orderId === undefined || note.orderId === query.orderId) &&
      (query.state === undefined || note.state === query.state),
  );

  matching.sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt - right.createdAt;
    }

    if (left.id === right.id) {
      return 0;
    }

    return left.id < right.id ? -1 : 1;
  });

  const page = matching.slice(query.offset, query.offset + query.limit);
  const consumed = query.offset + page.length;
  const openCount = matching.filter((note) => note.state === 'open').length;

  return {
    notes: page.map((note) => ({ ...note })),
    offset: query.offset,
    limit: query.limit,
    total: matching.length,
    openCount,
    resolvedCount: matching.length - openCount,
    nextOffset: consumed < matching.length ? consumed : null,
  };
}
