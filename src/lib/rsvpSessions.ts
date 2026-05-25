export type RsvpSessionId = 'harvest-table' | 'after-party-lunch';

export type RsvpSession = {
  id: RsvpSessionId;
  path: string;
  title: string;
  time: string;
  description: string;
  /** When true, the RSVP form is closed for this session. */
  full?: boolean;
};

export const RSVP_SESSIONS: Record<RsvpSessionId, RsvpSession> = {
  'harvest-table': {
    id: 'harvest-table',
    path: '/harvest-table',
    title: 'Harvest Table',
    time: '11:00 – 14:30',
    description: 'A seated lunch experience with conversation, food, and culture.',
    full: true,
  },
  'after-party-lunch': {
    id: 'after-party-lunch',
    path: '/after-party-lunch',
    title: 'The After Lunch Party',
    time: '15:00 – 20:00',
    description: 'An afternoon into evening gathering with music, drinks, and community.',
  },
};

/** Legacy path from earlier builds — redirects to the correct session page. */
const PATH_ALIASES: Record<string, RsvpSessionId> = {
  '/the-after-party': 'after-party-lunch',
};

const PATH_TO_SESSION: Record<string, RsvpSessionId> = {
  '/harvest-table': 'harvest-table',
  '/after-party-lunch': 'after-party-lunch',
  ...PATH_ALIASES,
};

export function sessionFromPath(pathname: string): RsvpSessionId | null {
  const normalized = pathname.replace(/\/$/, '') || '/';
  return PATH_TO_SESSION[normalized] ?? null;
}

export function isRsvpPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/';
  return normalized in PATH_TO_SESSION;
}
