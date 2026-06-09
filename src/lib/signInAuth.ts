import { AMPEX } from './ampexConfig.ts';
import { loginAttendeeAsync } from './attendeeAuth.ts';
import { loginOrganizerAsync } from './organizerAuth.ts';
import { ORGANIZER_ROUTES } from './mockOrganizer.ts';

export type SignInRole = 'organizer' | 'attendee';

export const SIGN_IN_PATH = '/login';
export const SIGN_IN_LABEL = 'Sign In with your AmpEx Account';

export function signInUrl(returnTo?: string): string {
  if (!returnTo || returnTo === SIGN_IN_PATH) return SIGN_IN_PATH;
  return `${SIGN_IN_PATH}?return=${encodeURIComponent(returnTo)}`;
}

/** Resolve post-login destination from ?return= or legacy login paths. */
export function resolveSignInReturnTo(): string {
  const value = new URLSearchParams(window.location.search).get('return');
  if (value?.startsWith('/organizer')) return value;
  if (value?.startsWith('/tickets')) return value;

  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/organizer/login' || path.startsWith('/organizer')) {
    return ORGANIZER_ROUTES.DASHBOARD;
  }
  return '/tickets/pick';
}

type LoginErr = Error & { code?: string; status?: number };

function pickLoginError(attendeeError: LoginErr | null, organizerError: LoginErr | null): LoginErr {
  if (organizerError?.code === 'PENDING_APPROVAL') return organizerError;
  if (attendeeError?.code === 'EMAIL_NOT_VERIFIED') return attendeeError;
  if (organizerError?.code === 'EMAIL_NOT_VERIFIED') return organizerError;
  return attendeeError ?? organizerError ?? new Error('Sign in failed.');
}

export async function universalSignInAsync(
  email: string,
  password: string,
): Promise<SignInRole> {
  if (AMPEX.USE_MOCK_DATA) {
    const returnTo = resolveSignInReturnTo();
    if (returnTo.startsWith('/organizer')) {
      await loginOrganizerAsync(email, password);
      return 'organizer';
    }
    await loginAttendeeAsync(email, password);
    return 'attendee';
  }

  let attendeeError: LoginErr | null = null;
  let organizerError: LoginErr | null = null;

  try {
    await loginAttendeeAsync(email, password);
    return 'attendee';
  } catch (e) {
    attendeeError = e as LoginErr;
  }

  try {
    await loginOrganizerAsync(email, password);
    return 'organizer';
  } catch (e) {
    organizerError = e as LoginErr;
  }

  throw pickLoginError(attendeeError, organizerError);
}

export function redirectAfterSignIn(role: SignInRole): void {
  if (role === 'organizer') {
    window.location.href = ORGANIZER_ROUTES.DASHBOARD;
    return;
  }

  const returnTo = resolveSignInReturnTo();
  window.location.href = returnTo.startsWith('/tickets') ? returnTo : '/tickets/pick';
}
