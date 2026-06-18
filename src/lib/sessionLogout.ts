import { AMPEX, fetchStore } from './ampexConfig.ts';
import { invalidateAttendeeSessionCache } from './attendeeSessionCache.ts';
import { dispatchAuthChanged } from './authEvents.ts';
import { invalidateCustomerProfileCache, invalidateMyTicketsCache } from './storeApi.ts';
import { clearAllSessionTokens } from './sessionTokens.ts';

const ATTENDEE_SESSION_KEY = 'yme_attendee_session';
const ORGANIZER_SESSION_KEY = 'yme_organizer_session';

let logoutGeneration = 0;

/** Bumps on every logout so in-flight profile resolves cannot restore a session. */
export function beginSessionLogout(): number {
  logoutGeneration += 1;
  return logoutGeneration;
}

export function isSessionLogoutStale(generation: number): boolean {
  return generation !== logoutGeneration;
}

export function currentSessionLogoutGeneration(): number {
  return logoutGeneration;
}

function clearLocalSessions(): void {
  sessionStorage.removeItem(ATTENDEE_SESSION_KEY);
  sessionStorage.removeItem(ORGANIZER_SESSION_KEY);
  clearAllSessionTokens();
}

/** Clear every client and server session (both attendee and organizer). */
export async function logoutAllSessions(): Promise<void> {
  const generation = beginSessionLogout();
  invalidateAttendeeSessionCache();
  invalidateCustomerProfileCache();
  invalidateMyTicketsCache();
  clearLocalSessions();

  if (!AMPEX.USE_MOCK_DATA) {
    await Promise.allSettled([
      fetchStore('/store/organizers/logout', { method: 'POST' }),
      fetchStore('/store/auth/logout', { method: 'POST' }),
    ]);
  }

  if (!isSessionLogoutStale(generation)) {
    clearLocalSessions();
    dispatchAuthChanged();
  }
}
