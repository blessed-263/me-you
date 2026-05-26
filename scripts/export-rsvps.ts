/**
 * Export RSVPs to CSV.
 * Usage: npm run export:rsvps [-- harvest-table | after-party-lunch]
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { getPool, logDatabaseConfig } from '../server/db.js';
import { RSVP_SESSION_IDS, type RsvpSessionId } from '../server/rsvpSessions.js';

const COLUMNS = [
  'full_name',
  'email',
  'phone',
  'guest_count',
  'session',
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

const sessionArg = process.argv[2];
if (
  sessionArg &&
  !(RSVP_SESSION_IDS as readonly string[]).includes(sessionArg)
) {
  console.error(
    `Unknown session "${sessionArg}". Use: ${RSVP_SESSION_IDS.join(', ')}`,
  );
  process.exit(1);
}

const sessionFilter = sessionArg as RsvpSessionId | undefined;

logDatabaseConfig();

const pool = getPool();
if (!pool) {
  console.error('Set DATABASE_URL in .env');
  process.exit(1);
}

try {
  const { rows } = await pool.query<Record<string, unknown>>(
    sessionFilter
      ? `SELECT full_name, email, phone, guest_count, session, created_at
         FROM rsvp_submissions
         WHERE session = $1
         ORDER BY created_at`
      : `SELECT full_name, email, phone, guest_count, session, created_at
         FROM rsvp_submissions
         ORDER BY session, created_at`,
    sessionFilter ? [sessionFilter] : [],
  );

  const outFile = sessionFilter
    ? `${sessionFilter}-rsvps.csv`
    : 'rsvps.csv';
  writeFileSync(outFile, toCsv(rows), 'utf8');
  console.log(`Wrote ${rows.length} row(s) to ${outFile}`);
} catch (err) {
  console.error('[export-rsvps] failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
