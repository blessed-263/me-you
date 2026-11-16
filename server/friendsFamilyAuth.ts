import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Friends & Family access checks. All secrets live in server env vars (Railway):
 *   FF_INVITE_TOKEN        secret part of the guest link /ff/<token>
 *   FF_ORGANISER_PASSCODE  shared passcode for hosts and door staff
 *   FF_SESSION_SECRET      optional extra key for organiser sessions
 * Changing the passcode (or FF_SESSION_SECRET) signs everyone out.
 */

export const FF_SESSION_HOURS = 14;

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/** Constant-time string comparison (hashes first so lengths never leak). */
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

export function getInviteToken(): string | null {
  const t = process.env.FF_INVITE_TOKEN?.trim();
  return t && t.length >= 16 ? t : null;
}

export function isValidInviteToken(candidate: unknown): boolean {
  const expected = getInviteToken();
  if (!expected || typeof candidate !== 'string' || !candidate) return false;
  return safeEqual(candidate, expected);
}

function getPasscode(): string | null {
  const p = process.env.FF_ORGANISER_PASSCODE?.trim();
  return p ? p : null;
}

export function isOrganiserConfigured(): boolean {
  return getPasscode() !== null;
}

export function isValidPasscode(candidate: unknown): boolean {
  const expected = getPasscode();
  if (!expected || typeof candidate !== 'string' || !candidate) return false;
  return safeEqual(candidate.trim(), expected);
}

function sessionKey(): Buffer | null {
  const pass = getPasscode();
  if (!pass) return null;
  const extra = process.env.FF_SESSION_SECRET?.trim() ?? '';
  return digest(`ff-organiser-session:${extra}:${pass}`);
}

function sign(key: Buffer, payload: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function issueOrganiserSession(now = Date.now()): { session: string; expiresAt: number } | null {
  const key = sessionKey();
  if (!key) return null;
  const expiresAt = now + FF_SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expiresAt);
  return { session: `${payload}.${sign(key, payload)}`, expiresAt };
}

export function isValidOrganiserSession(candidate: unknown, now = Date.now()): boolean {
  const key = sessionKey();
  if (!key || typeof candidate !== 'string') return false;
  const [payload, sig] = candidate.split('.');
  if (!payload || !sig || !/^\d+$/.test(payload)) return false;
  if (!safeEqual(sig, sign(key, payload))) return false;
  return Number(payload) > now;
}
