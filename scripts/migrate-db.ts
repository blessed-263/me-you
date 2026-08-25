/**
 * Run Postgres schema setup locally or against Railway DATABASE_URL.
 * Usage: npm run db:migrate
 */
import 'dotenv/config';
import { getPool, logDatabaseConfig } from '../server/db.js';
import { ensureJuneRsvpTable } from '../server/juneRsvp.js';
import { ensureRsvpTable } from '../server/rsvp.js';
import { ensureThirdEditionRsvpTable } from '../server/thirdEditionRsvp.js';

logDatabaseConfig();

const pool = getPool();
if (!pool) {
  console.error(
    'Set DATABASE_URL in .env (copy from Railway → Postgres → Connect).',
  );
  process.exit(1);
}

try {
  await ensureRsvpTable(() => pool);
  await ensureJuneRsvpTable(() => pool);
  await ensureThirdEditionRsvpTable(() => pool);
  console.log('[db] Migration finished.');
} catch (err) {
  console.error('[db] Migration failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
