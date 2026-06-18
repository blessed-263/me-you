import type { NextFunction, Request, Response } from 'express';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

function medusaApiBase(): string {
  return (
    process.env.VITE_MEDUSA_API_URL ||
    process.env.MEDUSA_API_URL ||
    ''
  ).replace(/\/$/, '');
}

/** Proxy /store/* to Medusa so production same-origin requests avoid browser CORS. */
export function createStoreProxy() {
  const base = medusaApiBase();

  return async function storeProxy(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (!base) {
      next();
      return;
    }

    const path = req.path || req.url || '';
    if (!path.startsWith('/store') && path !== '/get-publishable-key') {
      next();
      return;
    }

    const targetUrl = `${base}${req.originalUrl}`;

    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (!value || key === 'host') continue;
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }

      const init: RequestInit = {
        method: req.method,
        headers,
        redirect: 'manual',
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          init.body = JSON.stringify(req.body);
        }
      }

      const upstream = await fetch(targetUrl, init);
      res.status(upstream.status);

      upstream.headers.forEach((value, key) => {
        if (!HOP_BY_HOP.has(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      const body = Buffer.from(await upstream.arrayBuffer());
      res.send(body);
    } catch (error) {
      next(error);
    }
  };
}
