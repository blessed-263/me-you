import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool, type PoolConfig } from 'pg';
import { createRsvpHandler, ensureRsvpTable } from './rsvp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.RAILWAY_ENVIRONMENT === 'production';
const apiPort = Number(process.env.API_PORT) || 3001;
const port = Number(process.env.PORT) || apiPort;

function sslOption(connectionString: string): PoolConfig['ssl'] | undefined {
  try {
    const u = new URL(connectionString);
    const mode = u.searchParams.get('sslmode');
    if (
      mode === 'require' ||
      mode === 'verify-full' ||
      u.hostname.includes('railway') ||
      u.hostname.endsWith('neon.tech')
    ) {
      return { rejectUnauthorized: false };
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

let pool: Pool | null = null;

function getPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: sslOption(url),
    });
  }
  return pool;
}

async function ensureNewsletterTable(): Promise<void> {
  const p = getPool();
  if (!p) {
    console.warn(
      '[newsletter] DATABASE_URL is not set; POST /api/newsletter will return 503.',
    );
    return;
  }
  await p.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log('[newsletter] Table newsletter_subscribers is ready.');
}

const app = express();

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.FRONTEND_URL ||
  ''
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin &&
    (allowedOrigins.length === 0 || allowedOrigins.includes(origin))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '32kb' }));

function healthHandler(_req: express.Request, res: express.Response): void {
  res.json({ ok: true });
}

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

app.post('/api/rsvp', createRsvpHandler({ getPool }));

app.post('/api/newsletter', async (req, res) => {
  const p = getPool();
  if (!p) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const raw = req.body?.email;
  if (typeof raw !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const email = raw.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  try {
    const result = await p.query(
      `INSERT INTO newsletter_subscribers (email) VALUES ($1)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [email],
    );

    if (result.rowCount === 0) {
      res.status(200).json({ ok: true, alreadySubscribed: true });
      return;
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[newsletter] insert failed', err);
    res.status(500).json({ error: 'Could not save subscription' });
  }
});

/** Frontend is on Vercel. Only serve static files when SERVE_STATIC=true. */
function serveStaticSite(): boolean {
  return process.env.SERVE_STATIC === 'true';
}

async function main() {
  const listenPort = isProd ? port : apiPort;
  const withStatic = isProd && serveStaticSite();

  if (withStatic) {
    const staticDir = path.join(__dirname, '../dist');
    app.use(express.static(staticDir));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res.json({
        service: 'You & Me API',
        health: '/api/health',
        rsvp: 'POST /api/rsvp',
      });
    });
    if (isProd && allowedOrigins.length === 0) {
      console.warn(
        '[server] API-only: set ALLOWED_ORIGINS or FRONTEND_URL for Vercel CORS.',
      );
    }
  }

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

  try {
    await ensureNewsletterTable();
    await ensureRsvpTable(getPool);
  } catch (err) {
    console.error('[server] Database setup failed (API stays up):', err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
