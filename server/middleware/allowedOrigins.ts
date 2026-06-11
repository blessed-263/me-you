/** Parse ALLOWED_ORIGINS / FRONTEND_URL into a deduplicated origin list. */
export function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';
  return [...new Set(raw.split(',').map((o) => o.trim()).filter(Boolean))];
}

export function isLocalDevOrigin(origin: string): boolean {
  return (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  );
}

export function isOriginAllowedForCors(origin: string, allowed: string[]): boolean {
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.RAILWAY_ENVIRONMENT === 'production';

  if (!isProd && isLocalDevOrigin(origin)) {
    return true;
  }

  return allowed.includes(origin);
}

/** True when Origin or Referer matches an allowed origin (prefix match for Referer). */
export function isAllowedRequestOrigin(
  origin: string | undefined,
  referer: string | undefined,
  allowed: string[],
): boolean {
  if (allowed.length === 0) return false;
  if (origin && allowed.includes(origin)) return true;
  if (referer) {
    return allowed.some((o) => referer.startsWith(o));
  }
  return false;
}
