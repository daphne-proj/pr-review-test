import { InventoryReport } from './inventory-report-types';

export interface InventoryReportDownload {
  contentType: 'text/csv; charset=utf-8';
  filename: string;
  body: string;
}

function csvCell(value: string | number): string {
  let text = String(value);

  /* Product text must remain inert when a spreadsheet opens the download. */
  if (
    typeof value === 'string' &&
    (/^[=+\-@]/.test(text.trimStart()) || /^[\t\r\n]/.test(text))
  ) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function exportInventoryReport(
  report: InventoryReport,
): InventoryReportDownload {
  const lines = [
    [
      'SKU',
      'Product',
      'Available units',
      'Availability',
      'Recommended order units',
    ].join(','),
  ];

  for (const row of report.rows) {
    lines.push(
      [
        row.sku,
        row.name,
        row.availableQuantity,
        row.status,
        row.recommendedOrderQuantity,
      ]
        .map(csvCell)
        .join(','),
    );
  }

  return {
    contentType: 'text/csv; charset=utf-8',
    filename: `inventory-report-${report.offset}.csv`,
    body: `${lines.join('\r\n')}\r\n`,
  };
}
