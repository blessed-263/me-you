import { Pool, type PoolConfig } from 'pg';

/** Env vars Railway / Postgres plugins may expose (first non-empty wins). */
const DATABASE_URL_KEYS = [
  'DATABASE_URL',
  'DATABASE_PRIVATE_URL',
  'POSTGRES_URL',
  'PGURL',
] as const;

export function getDatabaseUrl(): string | undefined {
  for (const key of DATABASE_URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

export function databaseUrlSource(): string | null {
  for (const key of DATABASE_URL_KEYS) {
    if (process.env[key]?.trim()) {
      return key;
    }
  }
  return null;
}

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

export function getPool(): Pool | null {
  const url = getDatabaseUrl();
  if (!url) {
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

export async function checkDatabase(): Promise<
  'connected' | 'not_configured' | 'error'
> {
  const p = getPool();
  if (!p) {
    return 'not_configured';
  }
  try {
    await p.query('SELECT 1');
    return 'connected';
  } catch (err) {
    console.error('[db] connection check failed', err);
    return 'error';
  }
}

export function logDatabaseConfig(): void {
  const source = databaseUrlSource();
  if (source) {
    console.log(`[db] Using ${source} for Postgres.`);
    return;
  }
  console.error(
    `[db] No database URL found. Set DATABASE_URL on this service (Railway: add Postgres, then reference DATABASE_URL on the API service). Tried: ${DATABASE_URL_KEYS.join(', ')}.`,
  );
}
