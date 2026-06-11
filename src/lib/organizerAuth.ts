import { AMPEX, fetchStore } from './ampexConfig.ts';
import { ORGANIZER_ROUTES } from './mockOrganizer.ts';
import { signInUrl } from './signInAuth.ts';
import * as organizerApi from './organizerApi.ts';

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
  return session;
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
  return session;
}

/** Validate cookie session with Medusa and refresh sessionStorage (live mode). */
export async function resolveOrganizerSession(): Promise<OrganizerSession | null> {
  if (AMPEX.USE_MOCK_DATA) {
    return loadOrganizerSession();
  }

  const profile = await organizerApi.getOrganizerProfile();
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
  if (!AMPEX.USE_MOCK_DATA) {
    try {
      await fetchStore('/store/organizers/logout', { method: 'POST' });
    } catch {
      /* clear local session even if API call fails */
    }
  }
  sessionStorage.removeItem(SESSION_KEY);
}

export function requireOrganizerSession(): OrganizerSession | null {
  const session = loadOrganizerSession();
  if (!session) {
    window.location.replace(signInUrl(ORGANIZER_ROUTES.DASHBOARD));
    return null;
  }
  return session;
}
