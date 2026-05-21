/**
 * Run Postgres schema setup locally or against Railway DATABASE_URL.
 * Usage: npm run db:migrate
 */
import 'dotenv/config';
import { getDatabaseUrl, getPool, logDatabaseConfig } from '../server/db.js';
import { ensureRsvpTable } from '../server/rsvp.js';

logDatabaseConfig();

const pool = getPool();
if (!pool) {
  console.error(
    'Set DATABASE_URL in .env (copy from Railway → Postgres → Connect).',
  );
  process.exit(1);
}

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
