/**
 * Export June RSVPs to CSV (table: june_rsvps).
 * Usage: npm run export:june-rsvps
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { getPool, logDatabaseConfig } from '../server/db.js';
import { JUNE_RSVP_TABLE } from '../server/juneRsvp.js';

const COLUMNS = [
  'full_name',
  'email',
  'phone',
  'guest_count',
  'created_at',
] as const;

function toCsv(rows: Record<string, unknown>[]): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [COLUMNS.join(',')];
  for (const r of rows) {
    lines.push(COLUMNS.map((c) => esc(r[c])).join(','));
  }
  return lines.join('\n');
}

logDatabaseConfig();

const pool = getPool();
if (!pool) {
  console.error('Set DATABASE_URL in .env');
  process.exit(1);
}

try {
  const { rows } = await pool.query<Record<string, unknown>>(
    `SELECT full_name, email, phone, guest_count, created_at
     FROM ${JUNE_RSVP_TABLE}
     ORDER BY created_at`,
  );

  const outFile = 'june-rsvps.csv';
  writeFileSync(outFile, toCsv(rows), 'utf8');
  console.log(`Wrote ${rows.length} row(s) to ${outFile}`);
} catch (err) {
  console.error('[export-june-rsvps] failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
