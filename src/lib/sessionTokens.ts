const ORGANIZER_TOKEN_KEY = 'yme_organizer_token';
const ATTENDEE_TOKEN_KEY = 'yme_attendee_token';

export function setOrganizerToken(token: string | null | undefined): void {
  if (token) {
    sessionStorage.setItem(ORGANIZER_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ORGANIZER_TOKEN_KEY);
  }
}

export function getOrganizerToken(): string | null {
  return sessionStorage.getItem(ORGANIZER_TOKEN_KEY);
}

export function setAttendeeToken(token: string | null | undefined): void {
  if (token) {
    sessionStorage.setItem(ATTENDEE_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ATTENDEE_TOKEN_KEY);
  }
}

export function getAttendeeToken(): string | null {
  return sessionStorage.getItem(ATTENDEE_TOKEN_KEY);
}

export function clearAllSessionTokens(): void {
  sessionStorage.removeItem(ORGANIZER_TOKEN_KEY);
  sessionStorage.removeItem(ATTENDEE_TOKEN_KEY);
}

/** Pick Bearer token for a Medusa store path (cross-origin cookies are unreliable). */
export function resolveBearerTokenForStorePath(path: string): string | null {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (normalized.includes('/store/organizers')) {
    return getOrganizerToken() || getAttendeeToken();
  }

  if (
    normalized.includes('/store/customers') ||
    normalized.includes('/store/auth') ||
    normalized.includes('/store/tickets') ||
    normalized.includes('/store/carts') ||
    normalized.includes('/store/payment')
  ) {
    return getAttendeeToken() || getOrganizerToken();
  }

  return getOrganizerToken() || getAttendeeToken();
}

export function extractLoginToken(data: {
  token?: string;
  access_token?: string;
}): string | null {
  return data.token || data.access_token || null;
}
