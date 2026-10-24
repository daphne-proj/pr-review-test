import type { SupportNotePage } from '../../../packages/checkout/src';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderSupportNotes(page: SupportNotePage): string {
  const rows = page.notes.map((note) => {
    const resolution =
      note.state === 'resolved'
        ? `<p>Resolved by ${escapeHtml(note.resolvedBy)} at ${note.resolvedAt}</p>`
        : '<p>Open</p>';

    return [
      `<article data-note-id="${escapeHtml(note.id)}" data-revision="${note.revision}">`,
      `<h2>Order ${escapeHtml(note.orderId)}</h2>`,
      `<p>Recorded by ${escapeHtml(note.authorId)} at ${note.createdAt}</p>`,
      `<pre>${escapeHtml(note.body)}</pre>`,
      resolution,
      '</article>',
    ].join('\n');
  });
  const content =
    rows.length === 0 ? '<p>No matching notes.</p>' : rows.join('\n');

  return [
    '<section aria-label="Support notes">',
    `<p>${page.total} matching notes: ${page.openCount} open, ${page.resolvedCount} resolved.</p>`,
    content,
    '</section>',
  ].join('\n');
}
