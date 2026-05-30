import { getPool } from './db.js';

function capitalizeWord(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'there';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function firstNameFromFullName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return 'there';
  return capitalizeWord(trimmed.split(/\s+/)[0] ?? 'there');
}

/** Best-effort first name when we only have an email address. */
export function firstNameFromEmail(email: string): string {
  const local = (email.split('@')[0] ?? '').trim().toLowerCase();
  if (!local) return 'there';

  const segments = local.split(/[._-]+/).filter(Boolean);
  if (segments.length > 1) {
    return capitalizeWord(segments[0]);
  }

  const withoutIam = local.replace(/^iam(?=[a-z])/, '');
  if (withoutIam.startsWith('blessed')) {
    return 'Blessed';
  }
  if (local === 'nyathiblessed17' || local.startsWith('nyathiblessed')) {
    return 'Panashe';
  }

  const alpha = withoutIam.replace(/[^a-z].*$/, '');
  const candidate = capitalizeWord(alpha || withoutIam);
  if (candidate.length > 20) {
    return 'there';
  }
  return candidate;
}

/** Keep display names short so mobile clients do not truncate with ellipsis. */
export function sanitizeGuestDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'there';

  const firstWord = trimmed.split(/\s+/)[0] ?? trimmed;
  if (firstWord.length <= 20) {
    return capitalizeWord(firstWord);
  }

  return capitalizeWord(firstWord.slice(0, 20));
}

export function resolveGuestFirstName(
  email: string,
  fullNameFromDb?: string | null,
): string {
  if (fullNameFromDb?.trim()) {
    return sanitizeGuestDisplayName(firstNameFromFullName(fullNameFromDb));
  }
  return sanitizeGuestDisplayName(firstNameFromEmail(email));
}

export async function lookupRsvpNamesByEmail(
  emails: string[],
): Promise<Map<string, string>> {
  const pool = getPool();
  const map = new Map<string, string>();
  if (!pool || emails.length === 0) {
    return map;
  }

  const normalized = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);
  const { rows } = await pool.query<{ email: string; full_name: string }>(
    `SELECT lower(email) AS email, full_name
     FROM rsvp_submissions
     WHERE lower(email) = ANY($1::text[])`,
    [normalized],
  );

  for (const row of rows) {
    map.set(row.email, row.full_name);
  }

  return map;
}

export async function closeDbPool(): Promise<void> {
  const pool = getPool();
  if (pool) {
    await pool.end();
  }
}
