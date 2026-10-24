import type { SupportNoteQuery } from '../../../packages/checkout/src';
import { SupportNoteService } from '../../../packages/checkout/src';

function csvCell(value: string): string {
  /* Spreadsheet applications may execute formula-like text even in quoted CSV cells. */
  const text = /^[\s]*[=+\-@]/u.test(value) ? `'${value}` : value;
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportSupportNotes(
  notes: SupportNoteService,
  tenantId: string,
  filters: Pick<SupportNoteQuery, 'orderId' | 'state'> = {},
): string {
  const rows = [
    ['id', 'orderId', 'authorId', 'body', 'state', 'createdAt', 'revision']
      .map(csvCell)
      .join(','),
  ];
  let offset = 0;

  while (true) {
    const page = notes.list(tenantId, { ...filters, offset, limit: 100 });

    if (page.total > 1_000) {
      throw new Error('support note export exceeds 1000 rows');
    }

    for (const note of page.notes) {
      rows.push(
        [
          note.id,
          note.orderId,
          note.authorId,
          note.body,
          note.state,
          String(note.createdAt),
          String(note.revision),
        ]
          .map(csvCell)
          .join(','),
      );
    }

    if (page.nextOffset === null) {
      return `${rows.join('\r\n')}\r\n`;
    }

    offset = page.nextOffset;
  }
}
