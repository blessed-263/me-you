import { VENUE_ADDRESS_LINE, VENUE_MAPS_URL } from './venue.ts';

export type MockTicketType = {
  id: string;
  name: string;
  description: string;
  price: number;
  remaining: number | null;
  /** Medusa product variant id (live AmpEx mode) */
  variantId?: string;
};

export type EventInclusion = {
  id: string;
  part: string;
  title: string;
  subtitle: string;
};

export type MockEvent = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  timeLabel: string;
  venue: string;
  venueMapsUrl: string;
  category: string;
  imageUrl: string;
  description: string;
  /** @deprecated Use `inclusions` for display */
  highlights: string[];
  inclusions: EventInclusion[];
  ticketTypes: MockTicketType[];
  /** Storefront lifecycle — upcoming events accept ticket sales */
  publicStatus?: 'upcoming' | 'live' | 'ended';
};

/** Placeholder inventory — swap for AmpEx API when wired up. */
export const MOCK_EVENT: MockEvent = {
  id: '01KQVZ98HQX52PJ15TACANTR2X',
  title: 'You & Me — The Gathering',
  subtitle: 'Second edition',
  date: '2026-05-31T11:00:00+02:00',
  timeLabel: '11:00 AM to late',
  venue: VENUE_ADDRESS_LINE,
  venueMapsUrl: VENUE_MAPS_URL,
  category: 'Culture & Music',
  imageUrl: '/images/_DSC6449.jpg',
  description:
    'A cultural gathering centered around music, food, conversation and community. Curated long-table dining flows into an after-lunch sonic experience as the day shifts into night.',
  highlights: [
    'Harvest Table by Nela\'s Kitchen — curated meal and welcome drinks',
    'The After Lunch Gathering — music, movement, and a carefully assembled room',
    'Martell bar and rooftop setting at Primedia Sandton',
  ],
  inclusions: [
    {
      id: 'harvest',
      part: 'Part I',
      title: 'Harvest Table',
      subtitle: "By Nela's Kitchen — curated meal and welcome drinks",
    },
    {
      id: 'after_lunch',
      part: 'Part II',
      title: 'After Lunch Gathering',
      subtitle: 'Music, movement, and a carefully assembled room',
    },
    {
      id: 'setting',
      part: 'The setting',
      title: 'Martell bar & rooftop',
      subtitle: 'Primedia Sandton — cocktails, views, and the full-day atmosphere',
    },
  ],
  ticketTypes: [
    {
      id: 'tt_harvest_table',
      name: 'Harvest Table Experience',
      description: 'Part I · 11:00 – 14:30 · Includes curated meal, welcome drinks, and entry to the after gathering.',
      price: 1850,
      remaining: 42,
    },
    {
      id: 'tt_after_lunch',
      name: 'After Lunch Gathering',
      description: 'Part II · 15:00 – 20:00 · Sonic experience as the day shifts into night.',
      price: 650,
      remaining: 120,
    },
    {
      id: 'tt_full_day',
      name: 'Full Day Pass',
      description: 'Harvest Table and After Lunch — one seamless journey from midday to evening.',
      price: 2200,
      remaining: 28,
    },
  ],
};

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatPrice(zar: number): string {
  return zar.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
