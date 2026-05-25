export const RSVP_SESSION_IDS = ['harvest-table', 'after-party-lunch'] as const;

/** Sessions that no longer accept new RSVPs. */
export const RSVP_SESSION_FULL: Partial<Record<RsvpSessionId, true>> = {
  'harvest-table': true,
};

export function isRsvpSessionFull(sessionId: RsvpSessionId): boolean {
  return RSVP_SESSION_FULL[sessionId] === true;
}

export type RsvpSessionId = (typeof RSVP_SESSION_IDS)[number];

export type RsvpSessionMeta = {
  title: string;
  /** Full range for display, e.g. 11:00 – 14:30 */
  time: string;
  timeStart: string;
  timeEnd: string;
  tagline: string;
};

/** Accept legacy session id from older invite links. */
const SESSION_ALIASES: Record<string, RsvpSessionId> = {
  'the-after-party': 'after-party-lunch',
};

export const RSVP_SESSION_META: Record<RsvpSessionId, RsvpSessionMeta> = {
  'harvest-table': {
    title: 'Harvest Table',
    time: '11:00 – 14:30',
    timeStart: '11:00',
    timeEnd: '14:30',
    tagline: 'A seated lunch with conversation, food, and culture.',
  },
  'after-party-lunch': {
    title: 'The After Lunch Party',
    time: '15:00 – 20:00',
    timeStart: '15:00',
    timeEnd: '20:00',
    tagline: 'An afternoon into evening of music, drinks, and community.',
  },
};

export const EVENT_DATE_LABEL = 'Sunday, 31 May 2026';
export const EVENT_DATE_SHORT = '31 May 2026';

export function normalizeRsvpSessionId(value: string): RsvpSessionId | null {
  if ((RSVP_SESSION_IDS as readonly string[]).includes(value)) {
    return value as RsvpSessionId;
  }
  return SESSION_ALIASES[value] ?? null;
}

export function isRsvpSessionId(value: string): value is RsvpSessionId {
  return normalizeRsvpSessionId(value) !== null;
}

export function rsvpConfirmationSubject(sessionId: RsvpSessionId): string {
  return `${RSVP_SESSION_META[sessionId].title} — RSVP confirmed`;
}

export function rsvpNotifySubject(
  sessionId: RsvpSessionId,
  guestName: string,
): string {
  return `New RSVP — ${RSVP_SESSION_META[sessionId].title} — ${guestName}`;
}
