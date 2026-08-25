import 'dotenv/config';
import { checkDatabase, getPool, logDatabaseConfig } from './db.js';
import { createApp } from './app.js';
import { getAllowedOrigins } from './middleware/allowedOrigins.js';
import { ensureJuneRsvpTable } from './juneRsvp.js';
import { ensureRsvpTable } from './rsvp.js';
import { ensureThirdEditionRsvpTable } from './thirdEditionRsvp.js';

const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.RAILWAY_ENVIRONMENT === 'production';
const apiPort = Number(process.env.API_PORT) || 3001;
const port = Number(process.env.PORT) || apiPort;

function serveStaticSite(): boolean {
  return process.env.SERVE_STATIC === 'true';
}

async function main() {
  if (isProd && getAllowedOrigins().length === 0) {
    throw new Error(
      'ALLOWED_ORIGINS or FRONTEND_URL must be set in production for CORS and RSVP security.',
    );
  }

  const listenPort = isProd ? port : apiPort;
  const withStatic = isProd && serveStaticSite();
  const app = createApp({ serveStatic: withStatic });

  logDatabaseConfig();

  await new Promise<void>((resolve) => {
    app.listen(listenPort, '0.0.0.0', () => {
      if (withStatic) {
        console.log(`[server] production (site + API) on ${listenPort}`);
      } else if (isProd) {
        console.log(`[server] API-only on ${listenPort}`);
      } else {
        console.log(`[server] API on ${listenPort} (vite proxies /api)`);
      }
      resolve();
    });
  });

  const dbStatus = await checkDatabase();
  if (dbStatus === 'not_configured') {
    console.error(
      '[server] RSVP will return "Database not configured" until DATABASE_URL is set on this service.',
    );
  } else if (dbStatus === 'error') {
    console.error(
      '[server] DATABASE_URL is set but Postgres connection failed. Check credentials and SSL.',
    );
  }

  try {
    await ensureRsvpTable(getPool);
    await ensureJuneRsvpTable(getPool);
    await ensureThirdEditionRsvpTable(getPool);
  } catch (err) {
    console.error('[server] Database setup failed (API stays up):', err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
