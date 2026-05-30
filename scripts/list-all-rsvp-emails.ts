/**
 * List all May RSVP emails (deduped by email).
 * Usage: npx tsx scripts/list-all-rsvp-emails.ts
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { getPool, logDatabaseConfig } from '../server/db.js';

logDatabaseConfig();

const pool = getPool();
if (!pool) {
  console.error('Set DATABASE_URL in .env');
  process.exit(1);
}

try {
  const { rows } = await pool.query<{
    full_name: string;
    email: string;
    session: string | null;
  }>(`
    SELECT DISTINCT ON (lower(email))
      full_name,
      lower(email) AS email,
      session
    FROM rsvp_submissions
    WHERE email IS NOT NULL
      AND trim(email) <> ''
    ORDER BY lower(email), created_at ASC
  `);

  rows.sort((a, b) => a.full_name.localeCompare(b.full_name));

  const csvLines = ['full_name,email,session'];
  for (const r of rows) {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    csvLines.push([esc(r.full_name), esc(r.email), esc(r.session ?? '')].join(','));
  }

  const outFile = 'all-may-rsvp-emails.csv';
  writeFileSync(outFile, csvLines.join('\n'), 'utf8');

  console.log(`Total (deduped): ${rows.length}`);
  console.log(`Wrote ${outFile}\n`);
  for (const r of rows) {
    console.log(`${r.full_name} — ${r.email}`);
  }
} finally {
  await pool.end();
}
