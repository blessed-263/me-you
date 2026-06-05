import type { MockEvent } from './mockTickets.ts';

export type PublicEventStatus = 'upcoming' | 'live' | 'ended';

export function resolvePublicEventStatus(
  rawStatus: string | undefined,
  eventDate: string,
): PublicEventStatus {
  const status = (rawStatus ?? '').toLowerCase();
  if (status === 'completed' || status === 'ended' || status === 'cancelled') return 'ended';
  if (status === 'live') return 'live';
  const d = new Date(eventDate);
  if (!Number.isNaN(d.getTime()) && d.getTime() < Date.now() - 3_600_000) return 'ended';
  return 'upcoming';
}

export function isEventEnded(event: Pick<MockEvent, 'date' | 'publicStatus'>): boolean {
  return event.publicStatus === 'ended';
}

export function sortPublicEvents(events: MockEvent[]): MockEvent[] {
  const upcoming = events
    .filter((e) => !isEventEnded(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const ended = events
    .filter((e) => isEventEnded(e))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return [...upcoming, ...ended];
}

export function pickDefaultPublicEvent(events: MockEvent[]): MockEvent | null {
  const sorted = sortPublicEvents(events);
  if (sorted.length === 0) return null;
  return sorted.find((e) => !isEventEnded(e)) ?? sorted[0];
}
