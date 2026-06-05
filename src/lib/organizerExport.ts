/** Client-side CSV / JSON export for organizer preview data */

export function escapeCsvCell(value: string | number | boolean): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: (string | number | boolean)[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(rows: (string | number | boolean)[][], filename: string): void {
  downloadFile(rowsToCsv(rows), filename, 'text/csv;charset=utf-8');
}

export function downloadJson(data: unknown, filename: string): void {
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json;charset=utf-8');
}
