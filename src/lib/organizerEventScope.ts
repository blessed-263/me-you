import { getEditionById, getLiveEditions, type EventEdition } from './eventEditions.ts';
import { MOCK_EVENT } from './mockTickets.ts';

const SELECTED_EVENT_KEY = 'yme_organizer_selected_event';

/** Default when checkout appends orders without legacy event id */
export const DEFAULT_LIVE_EVENT_ID = MOCK_EVENT.id;

export function resolveOrganizerEventId(stored?: string | null): string | null {
  const live = getLiveEditions();
  if (live.length === 0) return null;
  if (stored && live.some((e) => e.id === stored)) return stored;
  return live[0].id;
}

export function loadSelectedEventId(): string | null {
  try {
    return resolveOrganizerEventId(localStorage.getItem(SELECTED_EVENT_KEY));
  } catch {
    return resolveOrganizerEventId(null);
  }
}

export function saveSelectedEventId(eventId: string): void {
  const live = getLiveEditions();
  if (!live.some((e) => e.id === eventId)) return;
  localStorage.setItem(SELECTED_EVENT_KEY, eventId);
}

export function getSelectedEdition(): EventEdition | null {
  const id = loadSelectedEventId();
  if (!id) return null;
  return getEditionById(id) ?? null;
}

export function publicTicketsHref(edition: EventEdition): string {
  if (edition.id === MOCK_EVENT.id) return '/tickets';
  return `/tickets?event=${encodeURIComponent(edition.id)}`;
}
