import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool, type PoolConfig } from 'pg';

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
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

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

async function main() {
  await ensureNewsletterTable();

  if (isProd) {
    const staticDir = path.join(__dirname, '../dist');
    app.use(express.static(staticDir));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
    app.listen(port, '0.0.0.0', () => {
      console.log(`[server] production listening on ${port}`);
    });
  } else {
    app.listen(apiPort, '0.0.0.0', () => {
      console.log(`[server] API listening on ${apiPort} (vite proxies /api here)`);
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
