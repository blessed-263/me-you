import { MOCK_EVENT } from './mockTickets.ts';
import { VENUE_NAME } from './venue.ts';

/** Organizer / storefront lifecycle for an event edition */
export type EventEditionStatus = 'live' | 'draft' | 'ended' | 'archived';

export type EventEdition = {
  id: string;
  title: string;
  editionLabel: string;
  date: string;
  venue: string;
  status: EventEditionStatus;
};

/** All editions — organizer UI only surfaces `live` entries */
export const EVENT_EDITIONS: EventEdition[] = [
  {
    id: MOCK_EVENT.id,
    title: MOCK_EVENT.title,
    editionLabel: MOCK_EVENT.subtitle,
    date: MOCK_EVENT.date,
    venue: VENUE_NAME,
    status: 'live',
  },
  {
    id: '01KQVZ98LIVEPOPUP2026',
    title: 'You & Me — Rooftop Sessions',
    editionLabel: 'Pop-up · June 2026',
    date: '2026-06-28T16:00:00+02:00',
    venue: VENUE_NAME,
    status: 'live',
  },
  {
    id: '01KQVZ98ENDED2025',
    title: 'You & Me — The Gathering',
    editionLabel: 'First edition · 2025',
    date: '2025-11-15T11:00:00+02:00',
    venue: VENUE_NAME,
    status: 'ended',
  },
  {
    id: '01KQVZ98ENDEDMAY2026',
    title: 'You & Me — The Gathering',
    editionLabel: 'Second edition · May 2026',
    date: '2026-05-31T11:00:00+02:00',
    venue: VENUE_NAME,
    status: 'ended',
  },
  {
    id: '01KQVZ98DRAFTWINTER2026',
    title: 'You & Me — Winter Room',
    editionLabel: 'Third edition · preview',
    date: '2026-08-30T11:00:00+02:00',
    venue: VENUE_NAME,
    status: 'draft',
  },
];

export function getLiveEditions(): EventEdition[] {
  return EVENT_EDITIONS.filter((e) => e.status === 'live');
}

export function getEditionById(id: string): EventEdition | undefined {
  return EVENT_EDITIONS.find((e) => e.id === id);
}

export function formatEditionDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
