/**
 * Friends & Family (22 November 2026) — event details and validation shared by
 * the RSVP endpoint and emails. Keep copy in step with src/friendsFamily/content.ts.
 */

export const FF_EVENT = {
  name: 'Friends & Family',
  hosts: 'You&Me with Martell × Kaya 959',
  dateLong: 'Sunday, 22 November 2026',
  time: '12:30 – 17:30',
  venueName: 'Kaya 959',
  venueStreet: '195 Jan Smut Ave',
  venueArea: 'Parktown North',
  signOff: 'YOU&ME · MARTELL · KAYA 959',
  legalLine: 'Not for sale to persons under the age of 18. Enjoy responsibly.',
} as const;

/** Next You&Me gathering, offered to guests who did not make the final list. */
export const FF_NEXT_EVENT = {
  dateLong: 'Sunday, 6 December 2026',
  ticketsUrl: 'https://www.howler.co.za/events/you-me-africa-with-martell-7685',
} as const;

/**
 * Internal guest-list labels (organisers only; never shown to guests or emailed).
 * Keep in step with FF_LABELS in src/friendsFamily/content.ts.
 */
export const FF_TYPE_LABELS = [
  'Media',
  'Influencer',
  'You&Me Day 1',
  'New Guest',
  'Important',
  'Sponsor Martell',
  'Sponsor Kaya',
] as const;

/** "Guest of …": special invites from the main team (at most one per guest). */
export const FF_GUEST_OF = [
  'Tshepo',
  'Wez',
  'Robby',
  'Palesa',
  'Robert',
  'Itumeleng',
  'Hanyane',
  'Thomas',
  'Yonela',
  'Leigh',
  'Eunicey',
] as const;

export const FF_TABLE = 'friends_family_rsvps';

/** Unlisted organiser path on the website (also hidden from search engines). */
export const FF_ORGANISER_PATH = '/ff/organiser';

export const FF_STATUSES = ['pending', 'approved', 'declined'] as const;
export type FfStatus = (typeof FF_STATUSES)[number];

export const FF_ERRORS = {
  firstNameEmpty: 'Please add your first name.',
  surnameEmpty: 'Please add your surname.',
  mobileEmpty: 'Please add your mobile number.',
  mobileInvalid: 'Use a South African mobile number, e.g. +27 82 123 4567.',
  emailEmpty: 'Please add your email address.',
  emailInvalid: 'Please check your email address.',
  attendingEmpty: 'Please let us know if you can make it.',
} as const;

const MOBILE_RE = /^(\+27|0)[6-8]\d{8}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Strips spaces, brackets and hyphens; returns +27… or null when invalid. */
export function normaliseSaMobile(raw: string): string | null {
  const compact = raw.replace(/[\s()-]/g, '');
  if (!MOBILE_RE.test(compact)) return null;
  return compact.startsWith('0') ? `+27${compact.slice(1)}` : compact;
}

export type FfRsvpInput = {
  firstName: string;
  surname: string;
  mobile: string;
  email: string;
  attending: boolean;
};

export type FfFieldErrors = Partial<Record<keyof FfRsvpInput, string>>;

export function validateFfRsvp(body: unknown):
  | { ok: true; value: FfRsvpInput }
  | { ok: false; fields: FfFieldErrors } {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const firstName = str(b.firstName);
  const surname = str(b.surname);
  const mobileRaw = str(b.mobile);
  const email = str(b.email).toLowerCase();
  const fields: FfFieldErrors = {};

  if (!firstName) fields.firstName = FF_ERRORS.firstNameEmpty;
  else if (firstName.length > 80) fields.firstName = FF_ERRORS.firstNameEmpty;
  if (!surname) fields.surname = FF_ERRORS.surnameEmpty;
  else if (surname.length > 80) fields.surname = FF_ERRORS.surnameEmpty;

  let mobile: string | null = null;
  if (!mobileRaw) fields.mobile = FF_ERRORS.mobileEmpty;
  else {
    mobile = mobileRaw.length > 20 ? null : normaliseSaMobile(mobileRaw);
    if (!mobile) fields.mobile = FF_ERRORS.mobileInvalid;
  }

  if (!email) fields.email = FF_ERRORS.emailEmpty;
  else if (email.length > 160 || !EMAIL_RE.test(email)) fields.email = FF_ERRORS.emailInvalid;

  if (typeof b.attending !== 'boolean') fields.attending = FF_ERRORS.attendingEmpty;

  if (Object.keys(fields).length > 0 || !mobile) return { ok: false, fields };
  return {
    ok: true,
    value: { firstName, surname, mobile, email, attending: b.attending as boolean },
  };
}

export function ffSiteOrigin(): string {
  return (process.env.FRONTEND_URL ?? process.env.SITE_URL ?? 'https://www.youandmeafrica.com')
    .split(',')[0]
    .trim()
    .replace(/\/$/, '');
}

export function ffInviteUrl(token: string): string {
  return `${ffSiteOrigin()}/ff/${encodeURIComponent(token)}`;
}
