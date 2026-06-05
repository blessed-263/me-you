import type { EventEdition } from './eventEditions.ts';

export const ORGANIZER_EVENTS_PER_PAGE = 3;
export const ORGANIZER_ITEMS_PER_PAGE = 10;

export type DashboardPeriod = '6months' | 'year' | 'all';

export function sortMonthlySales<T extends { month: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aIso = /^\d{4}-\d{2}$/.test(a.month);
    const bIso = /^\d{4}-\d{2}$/.test(b.month);
    if (aIso && bIso) return a.month.localeCompare(b.month);
    if (aIso) return -1;
    if (bIso) return 1;
    return a.month.localeCompare(b.month);
  });
}

export type TicketMixRow = { label: string; value: number };

export function prepareTicketMixRows(
  rows: { name: string; count: number }[],
): TicketMixRow[] {
  const merged = new Map<string, TicketMixRow>();

  for (const row of rows) {
    const label = row.name.trim() || 'General Admission';
    const key = label.toLowerCase();
    const hit = merged.get(key);
    if (hit) {
      hit.value += row.count;
    } else {
      merged.set(key, { label, value: row.count });
    }
  }

  return [...merged.values()]
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export function formatDashboardMonthLabel(month: unknown): string {
  if (month == null || month === '') return 'Unknown month';

  const raw = String(month).trim();
  if (!raw || raw === '—') return 'Unknown month';

  const isoMonth = raw.match(/^(\d{4})-(\d{2})/);
  if (isoMonth) {
    const d = new Date(Number(isoMonth[1]), Number(isoMonth[2]) - 1, 1);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }

  return raw;
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    items: items.slice(start, start + pageSize),
  };
}

export type EventGrouped<T extends { eventId: string }> = {
  eventId: string;
  title: string;
  editionLabel: string;
  date: string;
  status: EventEdition['status'];
  items: T[];
};

export function groupRecordsByEvent<T extends { eventId: string }>(
  records: T[],
  editions: EventEdition[],
): EventGrouped<T>[] {
  const byEvent = new Map<string, T[]>();
  for (const record of records) {
    const existing = byEvent.get(record.eventId);
    if (existing) {
      existing.push(record);
    } else {
      byEvent.set(record.eventId, [record]);
    }
  }

  const editionOrder = editions.map((e) => e.id);
  const eventIds = [...byEvent.keys()].sort((a, b) => {
    const ia = editionOrder.indexOf(a);
    const ib = editionOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return eventIds.map((eventId) => {
    const edition = editions.find((e) => e.id === eventId);
    return {
      eventId,
      title: edition?.title ?? 'Event',
      editionLabel: edition?.editionLabel ?? '',
      date: edition?.date ?? '',
      status: edition?.status ?? 'live',
      items: byEvent.get(eventId) ?? ([] as T[]),
    };
  });
}
