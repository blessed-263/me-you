import type { NextFunction, Request, Response } from 'express';
import { getAllowedOrigins, isAllowedRequestOrigin } from './allowedOrigins.js';

const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.RAILWAY_ENVIRONMENT === 'production';

/** Reject RSVP POSTs from unknown origins in production. */
export function requireAllowedOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isProd) {
    next();
    return;
  }

  const allowed = getAllowedOrigins();
  if (allowed.length === 0) {
    res.status(503).json({
      error: 'Server misconfigured: set ALLOWED_ORIGINS or FRONTEND_URL',
    });
    return;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  if (isAllowedRequestOrigin(origin, referer, allowed)) {
    next();
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
}
