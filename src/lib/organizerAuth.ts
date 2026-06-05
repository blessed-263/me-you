import { AMPEX, setOrganizerToken } from './ampexConfig.ts';
import * as organizerApi from './organizerApi.ts';

const SESSION_KEY = 'yme_organizer_session';

export type OrganizerSession = {
  email: string;
  name: string;
  loggedInAt: string;
  token?: string;
};

export function loginMock(email: string, _password: string): OrganizerSession {
  const trimmed = email.trim() || 'organizer@youandmeafrica.com';
  const session: OrganizerSession = {
    email: trimmed,
    name: 'You & Me Africa',
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
    token: result.token,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function loadOrganizerSession(): OrganizerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as OrganizerSession;
    if (session.token) setOrganizerToken(session.token);
    return session;
  } catch {
    return null;
  }
}

export function logoutOrganizer(): void {
  localStorage.removeItem(SESSION_KEY);
  setOrganizerToken(null);
}

export function requireOrganizerSession(): OrganizerSession | null {
  const session = loadOrganizerSession();
  if (!session) {
    window.location.replace('/organizer/login');
    return null;
  }
  if (!AMPEX.USE_MOCK_DATA && !session.token) {
    logoutOrganizer();
    window.location.replace('/organizer/login');
    return null;
  }
  return session;
}
