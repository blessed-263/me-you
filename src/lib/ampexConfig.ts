/** AmpEx / Medusa storefront configuration */

const mockEnv = import.meta.env.VITE_USE_MOCK_DATA as string | undefined;

export const AMPEX = {
  API_URL: (import.meta.env.VITE_MEDUSA_API_URL as string | undefined)?.replace(/\/$/, '') ?? '',
  PUBLISHABLE_KEY: (import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY as string | undefined) ?? '',
  REGION_ID: (import.meta.env.VITE_MEDUSA_REGION_ID as string | undefined) ?? '',
  ORGANIZER_ID: (import.meta.env.VITE_YME_ORGANIZER_ID as string | undefined) ?? '',
  CURRENCY_CODE: (import.meta.env.VITE_MEDUSA_CURRENCY_CODE as string | undefined) ?? 'ZAR',
  AMPEX_FRONTEND_URL:
    (import.meta.env.VITE_AMPEX_FRONTEND_URL as string | undefined)?.replace(/\/$/, '') ?? '',
  USE_MOCK_DATA: import.meta.env.PROD
    ? mockEnv === 'true'
    : (mockEnv ?? 'true') === 'true',
} as const;

export function storeUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // In dev, always use same-origin paths so Vite proxies /store → Medusa (no CORS).
  if (import.meta.env.DEV) return normalized;
  return AMPEX.API_URL ? `${AMPEX.API_URL}${normalized}` : normalized;
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

  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    try {
      JSON.parse(init.body);
      headers.set('Content-Type', 'application/json');
    } catch {
      /* not json */
    }
  }

  return fetch(storeUrl(path), { ...init, headers, credentials: 'include' });
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
