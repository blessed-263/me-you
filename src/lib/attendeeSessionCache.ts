type CachedAttendeeSession = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  loggedInAt: string;
};

let resolveAttendeeInFlight: Promise<CachedAttendeeSession | null> | null = null;
let resolveAttendeeCache: { session: CachedAttendeeSession | null; checkedAt: number } | null =
  null;

export const RESOLVE_ATTENDEE_CACHE_MS = 30_000;

export function getResolveAttendeeCache():
  | { session: CachedAttendeeSession | null; checkedAt: number }
  | null {
  return resolveAttendeeCache;
}

export function setResolveAttendeeCache(
  session: CachedAttendeeSession | null,
  checkedAt: number,
): void {
  resolveAttendeeCache = { session, checkedAt };
}

export function getResolveAttendeeInFlight(): Promise<CachedAttendeeSession | null> | null {
  return resolveAttendeeInFlight;
}

export function setResolveAttendeeInFlight(
  promise: Promise<CachedAttendeeSession | null> | null,
): void {
  resolveAttendeeInFlight = promise;
}

export function invalidateAttendeeSessionCache(): void {
  resolveAttendeeCache = null;
}
