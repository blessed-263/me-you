import { AMPEX, fetchStore } from './ampexConfig.ts';
import { dispatchAuthChanged } from './authEvents.ts';
import { ORGANIZER_ROUTES } from './mockOrganizer.ts';
import {
  currentSessionLogoutGeneration,
  isSessionLogoutStale,
  logoutAllSessions,
} from './sessionLogout.ts';
import { signInUrl } from './signInAuth.ts';
import { getOrganizerToken, setAttendeeToken } from './sessionTokens.ts';
import * as organizerApi from './organizerApi.ts';

const ATTENDEE_SESSION_KEY = 'yme_attendee_session';

const SESSION_KEY = 'yme_organizer_session';

export type OrganizerSession = {
  email: string;
  name: string;
  loggedInAt: string;
};

export function loginMock(email: string, _password: string): OrganizerSession {
  const trimmed = email.trim() || 'organizer@youandmeafrica.com';
  const session: OrganizerSession = {
    email: trimmed,
    name: 'You & Me Africa',
    loggedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  dispatchAuthChanged();
  return session;
}

function clearAttendeeSessionLocal(): void {
  sessionStorage.removeItem(ATTENDEE_SESSION_KEY);
}

export async function loginOrganizerAsync(
  email: string,
  password: string,
): Promise<OrganizerSession> {
  if (AMPEX.USE_MOCK_DATA) {
    return loginMock(email, password);
  }
  const result = await organizerApi.organizerLogin(email, password);
  const session: OrganizerSession = {
    email: result.email,
    name: result.name,
    loggedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  clearAttendeeSessionLocal();
  setAttendeeToken(null);
  if (!AMPEX.USE_MOCK_DATA) {
    try {
      await fetchStore('/store/auth/logout', { method: 'POST' });
    } catch {
      /* organizer session is authoritative */
    }
  }
  dispatchAuthChanged();
  return session;
}

export function loadOrganizerSession(): OrganizerSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OrganizerSession;
  } catch {
    return null;
  }
}

function saveOrganizerSession(session: OrganizerSession): OrganizerSession {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  dispatchAuthChanged();
  return session;
}

/** Validate cookie session with Medusa and refresh sessionStorage (live mode). */
export async function resolveOrganizerSession(): Promise<OrganizerSession | null> {
  const generation = currentSessionLogoutGeneration();

  if (AMPEX.USE_MOCK_DATA) {
    return loadOrganizerSession();
  }

  if (!loadOrganizerSession() && !getOrganizerToken()) {
    return null;
  }

  const profile = await organizerApi.getOrganizerProfile();
  if (isSessionLogoutStale(generation)) {
    return null;
  }

  if (!profile?.email) {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }

  const cached = loadOrganizerSession();
  return saveOrganizerSession({
    email: profile.email,
    name: profile.name || cached?.name || 'Organizer',
    loggedInAt: cached?.loggedInAt ?? new Date().toISOString(),
  });
}

export async function logoutOrganizer(): Promise<void> {
  await logoutAllSessions();
}

export function requireOrganizerSession(): OrganizerSession | null {
  const session = loadOrganizerSession();
  if (!session) {
    window.location.replace(signInUrl(ORGANIZER_ROUTES.DASHBOARD));
    return null;
  }
  return session;
}
