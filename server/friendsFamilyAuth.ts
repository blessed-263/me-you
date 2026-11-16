import { createHash, createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { getDatabaseUrl } from './db.js';

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

/**
 * Fallback when FF_INVITE_TOKEN is not set on Railway: SHA-256 fingerprint of the
 * invite token sent to guests for 22 November 2026. The token is 24 random
 * characters (144 bits), so this hash cannot be reversed into the link.
 * FF_INVITE_TOKEN, when set, always takes precedence.
 */
export const FF_INVITE_TOKEN_SHA256 =
  '3094ba41f920b58b75f7010be254d20dcc67720d2aab8eaae555b707e9bd3f7e';

export function isValidInviteToken(candidate: unknown): boolean {
  if (typeof candidate !== 'string' || !candidate || candidate.length > 200) return false;
  const expected = getInviteToken();
  if (expected) return safeEqual(candidate, expected);
  return timingSafeEqual(digest(candidate), Buffer.from(FF_INVITE_TOKEN_SHA256, 'hex'));
}

function getPasscode(): string | null {
  const p = process.env.FF_ORGANISER_PASSCODE?.trim();
  return p ? p : null;
}

/**
 * Fallback when FF_ORGANISER_PASSCODE is not set on Railway: scrypt fingerprint
 * of the organiser passcode chosen for 22 November 2026. scrypt is
 * deliberately slow and memory-hard, so the passcode cannot practically be
 * guessed from this public value. FF_ORGANISER_PASSCODE, when set, takes
 * precedence and this fallback is ignored.
 */
const FF_PASSCODE_SCRYPT = {
  salt: '45d0c9785d7387b711b1a25a32841935',
  hash: '2811c87328a24244db6ca56fe16e135037f8644bb030eebfe192b6b6dd89c564',
  params: { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
} as const;

/**
 * Without FF_ORGANISER_PASSCODE, sessions are signed with a key derived from the
 * database URL, which is already a server-only secret on Railway.
 */
function fallbackSessionSecret(): string | null {
  const db = getDatabaseUrl();
  return db ? `${db}:${FF_PASSCODE_SCRYPT.hash}` : null;
}

export function isOrganiserConfigured(): boolean {
  return getPasscode() !== null || fallbackSessionSecret() !== null;
}

export function isValidPasscode(candidate: unknown): boolean {
  if (typeof candidate !== 'string' || !candidate || candidate.length > 200) return false;
  const expected = getPasscode();
  if (expected) return safeEqual(candidate.trim(), expected);
  if (!fallbackSessionSecret()) return false;
  const derived = scryptSync(
    candidate.trim(),
    Buffer.from(FF_PASSCODE_SCRYPT.salt, 'hex'),
    32,
    FF_PASSCODE_SCRYPT.params,
  );
  return timingSafeEqual(derived, Buffer.from(FF_PASSCODE_SCRYPT.hash, 'hex'));
}

function sessionKey(): Buffer | null {
  const pass = getPasscode() ?? fallbackSessionSecret();
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
