export type FfStatus = 'pending' | 'approved' | 'declined';

export type FfRsvp = {
  id: string;
  firstName: string;
  surname: string;
  mobile: string;
  email: string;
  attending: boolean;
  status: FfStatus;
  arrived: boolean;
  checkedInAt: string | null;
  approvedEmailSentAt?: string | null;
  declinedEmailSentAt?: string | null;
  tags?: string[];
  guestOf?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResponseFilter = 'all' | 'yes' | 'no';
export type StatusFilter = 'all' | FfStatus | 'arrived';

const SAST = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const SAST_TIME = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** e.g. 2026-11-16 14:05 (SAST) */
export function formatSast(iso: string | null): string {
  if (!iso) return '';
  const parts = Object.fromEntries(SAST.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatSastTime(iso: string | null): string {
  return iso ? SAST_TIME.format(new Date(iso)) : '';
}

export function totals(rows: FfRsvp[]) {
  return {
    responses: rows.length,
    attending: rows.filter((r) => r.attending).length,
    notAttending: rows.filter((r) => !r.attending).length,
    pending: rows.filter((r) => r.status === 'pending').length,
    arrived: rows.filter((r) => r.arrived).length,
  };
}

/** Label filter value: 'all', a type label, or `guestof:<Name>`. */
export type LabelFilter = string;

export function hasLabel(r: FfRsvp, label: LabelFilter): boolean {
  if (label === 'all') return true;
  if (label.startsWith('guestof:')) return r.guestOf === label.slice('guestof:'.length);
  return (r.tags ?? []).includes(label);
}

/** Non-zero counts per label across all guests, in the fixed list order. */
export function labelCounts(
  rows: FfRsvp[],
  types: readonly string[],
  guestOf: readonly string[],
): { key: LabelFilter; label: string; n: number }[] {
  const out: { key: LabelFilter; label: string; n: number }[] = [];
  for (const t of types) {
    const n = rows.filter((r) => (r.tags ?? []).includes(t)).length;
    if (n) out.push({ key: t, label: t, n });
  }
  for (const g of guestOf) {
    const n = rows.filter((r) => r.guestOf === g).length;
    if (n) out.push({ key: `guestof:${g}`, label: `Guest of ${g}`, n });
  }
  return out;
}

export function filterRows(
  rows: FfRsvp[],
  response: ResponseFilter,
  status: StatusFilter,
  search: string,
  label: LabelFilter = 'all',
): FfRsvp[] {
  const q = search.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  return rows.filter((r) => {
    if (!hasLabel(r, label)) return false;
    if (response === 'yes' && !r.attending) return false;
    if (response === 'no' && r.attending) return false;
    if (status === 'arrived' ? !r.arrived : status !== 'all' && r.status !== status) return false;
    if (!q) return true;
    const name = `${r.firstName} ${r.surname}`.toLowerCase();
    if (name.includes(q) || r.email.toLowerCase().includes(q)) return true;
    if (qDigits.length >= 3) {
      const mobileDigits = r.mobile.replace(/\D/g, '');
      const local = mobileDigits.startsWith('27') ? `0${mobileDigits.slice(2)}` : mobileDigits;
      return mobileDigits.includes(qDigits) || local.includes(qDigits);
    }
    return false;
  });
}

function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Guest-typed text: stop Excel treating =, +, -, @ as a formula. */
function guestText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export const CSV_HEADER = [
  'First name',
  'Surname',
  'Mobile',
  'Email',
  'Attending',
  'Status',
  'First received (SAST)',
  'Last updated (SAST)',
  'Checked in (SAST)',
  'Labels',
  'Guest of',
];

/** Every value quoted; caller adds the UTF-8 BOM for downloads. */
export function toCsv(rows: FfRsvp[]): string {
  const lines = [CSV_HEADER.map(cell).join(',')];
  for (const r of rows) {
    lines.push(
      [
        guestText(r.firstName),
        guestText(r.surname),
        r.mobile,
        guestText(r.email),
        r.attending ? 'Yes' : 'No',
        r.status.charAt(0).toUpperCase() + r.status.slice(1),
        formatSast(r.createdAt),
        formatSast(r.updatedAt),
        r.arrived ? formatSast(r.checkedInAt) : '',
        (r.tags ?? []).join('; '),
        r.guestOf ?? '',
      ]
        .map(cell)
        .join(','),
    );
  }
  return lines.join('\r\n');
}
