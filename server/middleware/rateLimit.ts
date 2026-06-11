import type { RequestHandler } from 'express';
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { RedisClientType } from 'redis';
import { getRateLimitRedisClient } from './rate-limit-redis-client.js';

function createRedisStore(client: RedisClientType): RedisStore {
  return new RedisStore({
    prefix: 'yme:rsvp:rl:',
    sendCommand: (...args: string[]) => client.sendCommand(args),
  });
}

async function buildRateLimiter(): Promise<RateLimitRequestHandler> {
  const windowMs =
    Number(process.env.RSVP_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  const max = Number(process.env.RSVP_RATE_LIMIT_MAX) || 10;

  const client = await getRateLimitRedisClient();
  const store = client ? createRedisStore(client) : undefined;

  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store,
    message: { error: 'Too many requests' },
  });
}

export function createRsvpRateLimit(): RequestHandler {
  let handler: RateLimitRequestHandler | null = null;
  let initPromise: Promise<RateLimitRequestHandler> | null = null;

  const init = (): Promise<RateLimitRequestHandler> => {
    if (!initPromise) {
      initPromise = buildRateLimiter().then((limiter) => {
        handler = limiter;
        return limiter;
      });
    }
    return initPromise;
  };

  void init();

  return (req, res, next) => {
    const run = async () => {
      try {
        const limiter = handler ?? (await init());
        limiter(req, res, next);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[rsvp-rate-limit] Middleware error:', message);
        next();
      }
    };
    void run();
  };
}
