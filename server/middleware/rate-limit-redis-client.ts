import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType | null> | null = null;

/** Shared Redis client for RSVP rate limiting across API replicas. */
export async function getRateLimitRedisClient(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  if (client?.isOpen) {
    return client;
  }

  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        client = createClient({ url });
        client.on('error', (err) => {
          console.error('[rsvp-rate-limit] Redis error:', err.message);
        });
        await client.connect();
        console.log('[rsvp-rate-limit] Connected to Redis');
        return client;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          '[rsvp-rate-limit] Redis unavailable; using in-memory store:',
          message,
        );
        client = null;
        return null;
      } finally {
        connectPromise = null;
      }
    })();
  }

  return connectPromise;
}

void getRateLimitRedisClient();
