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

export function isEventLive(event: Pick<MockEvent, 'publicStatus'>): boolean {
  return event.publicStatus === 'live';
}

export function publicEventBadge(event: Pick<MockEvent, 'publicStatus'>): {
  label: string;
  tone: 'live' | 'sale' | 'ended';
} {
  if (event.publicStatus === 'live') return { label: 'Live', tone: 'live' };
  if (event.publicStatus === 'upcoming') return { label: 'On sale', tone: 'sale' };
  return { label: 'Ended', tone: 'ended' };
}

export function sortPublicEvents(events: MockEvent[]): MockEvent[] {
  const live = events
    .filter((e) => e.publicStatus === 'live')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcoming = events
    .filter((e) => e.publicStatus === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const ended = events
    .filter((e) => isEventEnded(e))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return [...live, ...upcoming, ...ended];
}

export function partitionPublicEvents(events: MockEvent[]): {
  active: MockEvent[];
  past: MockEvent[];
} {
  const sorted = sortPublicEvents(events);
  return {
    active: sorted.filter((e) => !isEventEnded(e)),
    past: sorted.filter((e) => isEventEnded(e)),
  };
}

export function pickDefaultPublicEvent(events: MockEvent[]): MockEvent | null {
  const sorted = sortPublicEvents(events);
  if (sorted.length === 0) return null;
  return sorted.find((e) => !isEventEnded(e)) ?? sorted[0];
}
