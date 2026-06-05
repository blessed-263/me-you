/**
 * Export Harvest Table RSVPs for ticket import.
 * Columns: email, ticket type, quantity, name
 *
 * Usage: npm run export:harvest-table-tickets
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { getPool, logDatabaseConfig } from '../server/db.js';

const TICKET_TYPE = 'Harvest Table - 11h00 - 14:30';
const QUANTITY = 1;
const OUT_FILE = 'harvest-table-tickets.csv';

function toCsv(rows: { email: string; name: string }[]): string {
  const lines = ['email,ticket type,quantity,name'];
  for (const r of rows) {
    lines.push(`${r.email},${TICKET_TYPE},${QUANTITY},${r.name}`);
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
  const { rows } = await pool.query<{ email: string; full_name: string }>(
    `SELECT email, full_name
     FROM rsvp_submissions
     WHERE session = 'harvest-table'
     ORDER BY created_at`,
  );

  writeFileSync(
    OUT_FILE,
    toCsv(rows.map((r) => ({ email: r.email.trim(), name: r.full_name.trim() }))),
    'utf8',
  );
  console.log(`Wrote ${rows.length} row(s) to ${OUT_FILE}`);
} catch (err) {
  console.error('[export-harvest-table-tickets] failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
