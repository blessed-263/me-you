const ORGANIZER_TIME_ZONE = 'Africa/Johannesburg';

export function parseApiDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && /^\d+(\.\d+)?$/.test(trimmed)) {
      const ms = asNumber < 1e12 ? asNumber * 1000 : asNumber;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return d;
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatOrganizerDateTime(value: unknown): string {
  const d = parseApiDate(value);
  if (!d) return '—';
  return d.toLocaleString('en-ZA', {
    timeZone: ORGANIZER_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function organizerDateMs(value: unknown): number {
  return parseApiDate(value)?.getTime() ?? 0;
}
