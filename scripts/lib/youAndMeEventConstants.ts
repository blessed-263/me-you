/**
 * Shared edition constants for RSVP / event summary exports.
 */
import { RSVP_SESSION_META, EVENT_DATE_SHORT } from '../../server/rsvpSessions.js';

export const FIRST_EDITION = {
  name: 'You & Me Africa — First Edition',
  date: '26 April 2026',
  rsvps: {
    harvestTable: 108,
    afterLunch: 78,
  },
  tickets: {
    paidPurchases: 0,
    sponsor: [
      { type: 'Martell sponsors', count: 20 },
      { type: 'Stella', count: 5 },
      { type: 'Château Gateau', count: 5 },
      { type: 'Emmanuel', count: 2 },
      { type: 'Elliot and Gudman', count: 4 },
    ],
  },
} as const;

export const SECOND_EDITION = {
  name: 'You & Me Africa — Second Edition',
  date: EVENT_DATE_SHORT,
  tickets: {
    paidPurchases: 13,
    sponsor: [
      { type: 'Martell', count: 12 },
      { type: 'Stella Artois', count: 5 },
      { type: 'Primedia', count: 6 },
    ],
  },
} as const;

export const JUNE_GATHERING = {
  name: 'You & Me Africa — June Gathering',
  date: 'June 2026',
} as const;

export function sessionLabel(session: string): string {
  if (session === 'harvest-table') {
    return `${RSVP_SESSION_META['harvest-table'].title} (Session 1)`;
  }
  if (session === 'after-party-lunch' || session === 'the-after-party') {
    return `${RSVP_SESSION_META['after-party-lunch'].title} (Session 2)`;
  }
  return session;
}

export const RSVP_LIST_COLUMNS = [
  '#',
  'Full Name',
  'Email',
  'Phone',
  'Guests',
  'Registered At',
] as const;

export const ALL_RSVP_COLUMNS = [
  ...RSVP_LIST_COLUMNS,
  'Event',
  'Session',
] as const;
