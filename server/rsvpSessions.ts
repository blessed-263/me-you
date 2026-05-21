export const RSVP_SESSION_IDS = ['harvest-table', 'after-party-lunch'] as const;

export type RsvpSessionId = (typeof RSVP_SESSION_IDS)[number];

/** Accept legacy session id from older invite links. */
const SESSION_ALIASES: Record<string, RsvpSessionId> = {
  'the-after-party': 'after-party-lunch',
};

export const RSVP_SESSION_META: Record<
  RsvpSessionId,
  { title: string; time: string }
> = {
  'harvest-table': {
    title: 'Harvest Table',
    time: '11:00 – 14:30',
  },
  'after-party-lunch': {
    title: 'The After Lunch Party',
    time: '15:00 – 20:00',
  },
};

export function normalizeRsvpSessionId(value: string): RsvpSessionId | null {
  if ((RSVP_SESSION_IDS as readonly string[]).includes(value)) {
    return value as RsvpSessionId;
  }
  return SESSION_ALIASES[value] ?? null;
}

export function isRsvpSessionId(value: string): value is RsvpSessionId {
  return normalizeRsvpSessionId(value) !== null;
}
