import helmet from 'helmet';
import type { RequestHandler } from 'express';

/** Security headers for the Express RSVP API (JSON-only; no strict CSP). */
export const securityHeadersMiddleware: RequestHandler = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});
