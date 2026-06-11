import { AMPEX, fetchStore } from './ampexConfig.ts';
import { dispatchAuthChanged } from './authEvents.ts';
import { loadOrganizerSession } from './organizerAuth.ts';
import { getOrganizerProfile } from './organizerApi.ts';
import {
  currentSessionLogoutGeneration,
  isSessionLogoutStale,
  logoutAllSessions,
} from './sessionLogout.ts';
import * as storeApi from './storeApi.ts';

const SESSION_KEY = 'yme_attendee_session';
const ORGANIZER_SESSION_KEY = 'yme_organizer_session';

export type AttendeeSession = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  loggedInAt: string;
};

export function attendeeDisplayName(session: AttendeeSession): string {
  return `${session.firstName} ${session.lastName}`.trim() || session.email;
}

export function loginAttendee(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): AttendeeSession {
  if (!AMPEX.USE_MOCK_DATA) {
    throw new Error('Use loginAttendeeAsync for live AmpEx mode');
  }
  const existing = loadAttendeeSession();
  const email = input.email.trim().toLowerCase();
  const session: AttendeeSession = {
    email,
    firstName: (input.firstName ?? existing?.firstName ?? '').trim() || 'Guest',
    lastName: (input.lastName ?? existing?.lastName ?? '').trim(),
    phone: (input.phone ?? existing?.phone ?? '').trim(),
    loggedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  dispatchAuthChanged();
  return session;
}

function clearOrganizerSessionLocal(): void {
  sessionStorage.removeItem(ORGANIZER_SESSION_KEY);
}

export async function loginAttendeeAsync(
  email: string,
  password: string,
): Promise<AttendeeSession> {
  if (AMPEX.USE_MOCK_DATA) {
    return loginAttendee({ email, password });
  }
  const result = await storeApi.customerLogin(email, password);
  const session: AttendeeSession = {
    email: result.email,
    firstName: result.firstName || 'Guest',
    lastName: result.lastName,
    phone: '',
    loggedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  clearOrganizerSessionLocal();
  if (!AMPEX.USE_MOCK_DATA) {
    try {
      await fetchStore('/store/organizers/logout', { method: 'POST' });
    } catch {
      /* attendee session is authoritative */
    }
  }
  dispatchAuthChanged();
  return session;
}

export async function registerAttendeeAsync(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<{ verificationRequired: boolean; email: string }> {
  if (AMPEX.USE_MOCK_DATA) {
    loginAttendee(input);
    return { verificationRequired: false, email: input.email };
  }
  return storeApi.customerRegister(input);
}

export function loadAttendeeSession(): AttendeeSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttendeeSession;
    if (!parsed.email) return null;
    return { ...parsed, email: parsed.email.toLowerCase() };
  } catch {
    return null;
  }
}

function saveAttendeeSession(session: AttendeeSession): AttendeeSession {
  const normalized = { ...session, email: session.email.toLowerCase() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  dispatchAuthChanged();
  return normalized;
}

/** Validate cookie session with Medusa and refresh sessionStorage (live mode). */
export async function resolveAttendeeSession(): Promise<AttendeeSession | null> {
  const generation = currentSessionLogoutGeneration();

  if (AMPEX.USE_MOCK_DATA) {
    if (loadOrganizerSession()) return null;
    return loadAttendeeSession();
  }

  const organizerProfile = await getOrganizerProfile();
  if (isSessionLogoutStale(generation)) {
    return null;
  }

  if (organizerProfile?.email) {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }

  const profile = await storeApi.getCustomerProfile();
  if (isSessionLogoutStale(generation)) {
    return null;
  }

  if (!profile?.email) {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }

  const cached = loadAttendeeSession();
  return saveAttendeeSession({
    email: profile.email,
    firstName: profile.firstName || cached?.firstName || 'Guest',
    lastName: profile.lastName || cached?.lastName || '',
    phone: profile.phone || cached?.phone || '',
    loggedInAt: cached?.loggedInAt ?? new Date().toISOString(),
  });
}

export async function logoutAttendee(): Promise<void> {
  await logoutAllSessions();
}

import { signInUrl } from './signInAuth.ts';

export function ticketsLoginUrl(returnTo?: string): string {
  if (!returnTo || returnTo === '/tickets/login') return signInUrl('/tickets/pick');
  return signInUrl(returnTo);
}

export function parseTicketsReturnTo(): string {
  const value = new URLSearchParams(window.location.search).get('return');
  if (!value || !value.startsWith('/tickets')) return '/tickets/pick';
  return value;
}

export function requireAttendeeSession(returnTo?: string): AttendeeSession | null {
  const session = loadAttendeeSession();
  if (!session) {
    window.location.replace(ticketsLoginUrl(returnTo ?? window.location.pathname));
    return null;
  }
  return session;
}

export function ticketsPickHref(eventId?: string): string {
  const base = loadAttendeeSession() ? '/tickets/pick' : ticketsLoginUrl('/tickets/pick');
  if (!eventId) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}event=${encodeURIComponent(eventId)}`;
}
