import { resolveBearerTokenForStorePath } from './sessionTokens.ts';

/** AmpEx / Medusa storefront configuration */

const mockEnv = import.meta.env.VITE_USE_MOCK_DATA as string | undefined;
const ampExEnabled = import.meta.env.VITE_AMPEX_ENABLED === 'true';

export const AMPEX = {
  ENABLED: ampExEnabled,
  API_URL: (import.meta.env.VITE_MEDUSA_API_URL as string | undefined)?.replace(/\/$/, '') ?? '',
  PUBLISHABLE_KEY: (import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY as string | undefined) ?? '',
  REGION_ID: (import.meta.env.VITE_MEDUSA_REGION_ID as string | undefined) ?? '',
  ORGANIZER_ID: (import.meta.env.VITE_YME_ORGANIZER_ID as string | undefined) ?? '',
  CURRENCY_CODE: (import.meta.env.VITE_MEDUSA_CURRENCY_CODE as string | undefined) ?? 'ZAR',
  AMPEX_FRONTEND_URL:
    (import.meta.env.VITE_AMPEX_FRONTEND_URL as string | undefined)?.replace(/\/$/, '') ?? '',
  USE_MOCK_DATA: !ampExEnabled
    ? true
    : import.meta.env.PROD
      ? mockEnv === 'true'
      : (mockEnv ?? 'true') === 'true',
} as const;
const STORE_REQUEST_TIMEOUT_MS = 20_000;

export function storeUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // Same-origin /store is proxied in dev (Vite) and production (Vercel rewrite / Express).
  // Direct cross-origin calls to Railway often surface as intermittent CORS errors when the
  // upstream times out or returns 502 without Access-Control-Allow-Origin.
  if (import.meta.env.VITE_STORE_DIRECT_API === 'true' && AMPEX.API_URL) {
    return `${AMPEX.API_URL}${normalized}`;
  }
  return normalized;
}

export async function fetchStore(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers();
  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((v, k) => headers.set(k, v));
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([k, v]) => headers.set(k, v));
    } else {
      Object.entries(init.headers).forEach(([k, v]) => headers.set(k, v as string));
    }
  }

  if (AMPEX.PUBLISHABLE_KEY && !headers.has('x-publishable-api-key')) {
    headers.set('x-publishable-api-key', AMPEX.PUBLISHABLE_KEY);
  }

  const bearer = resolveBearerTokenForStorePath(path);
  if (bearer && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${bearer}`);
  }

  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    try {
      JSON.parse(init.body);
      headers.set('Content-Type', 'application/json');
    } catch {
      /* not json */
    }
  }

  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), STORE_REQUEST_TIMEOUT_MS);
  const signal = init.signal ?? timeoutController.signal;

  try {
    return await fetch(storeUrl(path), { ...init, headers, credentials: 'include', signal });
  } catch (error) {
    const isTimeout =
      error instanceof DOMException &&
      error.name === 'AbortError' &&
      !init.signal;
    if (isTimeout) {
      const err = new Error('The payment server took too long to respond. Please try again.');
      (err as Error & { code?: string }).code = 'network_timeout';
      throw err;
    }

    const err = new Error('Could not reach the payment server. Check your connection and try again.');
    (err as Error & { code?: string }).code = 'network_error';
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function fetchStoreJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchStore(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { message?: string }).message || res.statusText) as Error & {
      code?: string;
      status?: number;
      data?: unknown;
    };
    err.code = (data as { code?: string }).code;
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}
