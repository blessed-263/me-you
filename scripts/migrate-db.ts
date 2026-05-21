/**
 * Run Postgres schema setup locally or against Railway DATABASE_URL.
 * Usage: npm run db:migrate
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { ensureRsvpTable } from '../server/rsvp.js';

function sslOption(connectionString: string) {
  try {
    const u = new URL(connectionString);
    const mode = u.searchParams.get('sslmode');
    if (
      mode === 'require' ||
      mode === 'verify-full' ||
      u.hostname.includes('railway') ||
      u.hostname.endsWith('neon.tech')
    ) {
      return { rejectUnauthorized: false as const };
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error('Set DATABASE_URL in .env (Railway Postgres connection string).');
  process.exit(1);
}

const pool = new Pool({ connectionString: url, ssl: sslOption(url) });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log('[newsletter] Table newsletter_subscribers is ready.');

  await ensureRsvpTable(() => pool);
  console.log('[db] Migration finished.');
} catch (err) {
  console.error('[db] Migration failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
