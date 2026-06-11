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

/** Buyer-only accounts get 403 from organizer login; safe to try attendee next. */
function shouldTryAttendeeAfterOrganizerFailure(err: LoginErr): boolean {
  if (err.code === 'PENDING_APPROVAL' || err.code === 'EMAIL_NOT_VERIFIED') return false;
  return err.status === 403;
}

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

  let organizerError: LoginErr | null = null;

  try {
    await loginOrganizerAsync(email, password);
    return 'organizer';
  } catch (e) {
    organizerError = e as LoginErr;
    if (!shouldTryAttendeeAfterOrganizerFailure(organizerError)) {
      throw organizerError;
    }
  }

  try {
    await loginAttendeeAsync(email, password);
    return 'attendee';
  } catch (e) {
    throw pickLoginError(e as LoginErr, organizerError);
  }
}

export function redirectAfterSignInTarget(role: SignInRole): string {
  const returnTo = resolveSignInReturnTo();
  if (role === 'organizer') {
    return returnTo.startsWith('/organizer')
      ? returnTo
      : ORGANIZER_ROUTES.DASHBOARD;
  }
  return returnTo.startsWith('/tickets') ? returnTo : '/tickets/pick';
}

export function redirectAfterSignIn(
  role: SignInRole,
  navigate?: (to: string) => void,
): void {
  const target = redirectAfterSignInTarget(role);
  if (navigate) {
    navigate(target);
    return;
  }
  window.location.href = target;
}
