import { escapeHtml } from './html';

export function renderPage(title: string, content: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="/admin.css"></head><body><main>${content}</main></body></html>`;
}
