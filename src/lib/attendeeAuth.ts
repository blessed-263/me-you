import { AMPEX, setAttendeeToken } from './ampexConfig.ts';
import * as storeApi from './storeApi.ts';

const SESSION_KEY = 'yme_attendee_session';

export type AttendeeSession = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  loggedInAt: string;
  token?: string;
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
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
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
    token: result.token,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttendeeSession;
    if (!parsed.email) return null;
    const session = { ...parsed, email: parsed.email.toLowerCase() };
    if (session.token) setAttendeeToken(session.token);
    return session;
  } catch {
    return null;
  }
}

export function logoutAttendee(): void {
  localStorage.removeItem(SESSION_KEY);
  setAttendeeToken(null);
}

export function ticketsLoginUrl(returnTo?: string): string {
  const base = '/tickets/login';
  if (!returnTo || returnTo === base) return base;
  return `${base}?return=${encodeURIComponent(returnTo)}`;
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
  if (!AMPEX.USE_MOCK_DATA && !session.token) {
    logoutAttendee();
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
