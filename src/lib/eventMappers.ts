import type { EventEdition } from './eventEditions.ts';
import { resolvePublicEventStatus } from './eventLifecycle.ts';
import type { MockEvent, MockTicketType } from './mockTickets.ts';
import { VENUE_MAPS_URL } from './venue.ts';

export function mapBackendEventToMockEvent(raw: Record<string, unknown>): MockEvent {
  const date = String(raw.date ?? raw.event_date ?? new Date().toISOString());
  const imageUrl = String(
    raw.imageUrl ?? raw.image_url ?? raw.thumbnail ?? '/images/_DSC6449.jpg',
  );
  const inclusions = Array.isArray(raw.inclusions)
    ? (raw.inclusions as MockEvent['inclusions'])
    : [];

  const publicStatus = resolvePublicEventStatus(
    String(raw.status ?? raw.publicStatus ?? ''),
    date,
  );

  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? raw.name ?? 'Event'),
    subtitle: String(raw.subtitle ?? raw.edition ?? raw.category ?? ''),
    date,
    publicStatus,
    timeLabel: String(raw.timeLabel ?? raw.time ?? raw.event_time ?? 'TBA'),
    venue: String(raw.venue ?? raw.venue_name ?? 'TBA'),
    venueMapsUrl: String(raw.venueMapsUrl ?? VENUE_MAPS_URL),
    category: String(raw.category ?? 'Culture & Music'),
    imageUrl,
    description: String(raw.description ?? raw.longDescription ?? ''),
    highlights: Array.isArray(raw.highlights) ? (raw.highlights as string[]) : [],
    inclusions,
    ticketTypes: mapTicketTypes(raw.ticketTypes ?? raw.ticket_types),
  };
}

export function mapTicketTypes(raw: unknown): MockTicketType[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t: Record<string, unknown>) => ({
    id: String(t.id ?? t.variant_id ?? ''),
    name: String(t.name ?? 'Ticket'),
    description: String(t.description ?? ''),
    price: typeof t.price === 'number' ? t.price : Number(t.price) || 0,
    remaining: typeof t.remaining === 'number' ? t.remaining : t.remaining === null ? null : Number(t.remaining) ?? null,
    variantId: String(t.variant_id ?? t.id ?? ''),
  })) as MockTicketType[];
}

export type ApiTicketType = MockTicketType & { variantId: string };

export function mapTicketsEndpoint(data: {
  ticket_types?: Record<string, unknown>[];
  ticketTypes?: Record<string, unknown>[];
}): ApiTicketType[] {
  const list = data.ticket_types ?? data.ticketTypes ?? [];
  return list.map((t) => ({
    id: String(t.id ?? t.variant_id ?? ''),
    variantId: String(t.variant_id ?? t.id ?? ''),
    name: String(t.name ?? 'Ticket'),
    description: String(t.description ?? ''),
    price: typeof t.price === 'number' ? t.price : Number(t.price) || 0,
    remaining:
      typeof t.remaining === 'number'
        ? t.remaining
        : t.remaining === null
          ? null
          : Number(t.remaining) ?? null,
  }));
}

export function mapBackendEventToEdition(raw: Record<string, unknown>): EventEdition {
  const statusRaw = String(raw.status ?? 'published').toLowerCase();
  let status: EventEdition['status'] = 'live';
  if (statusRaw === 'draft' || statusRaw === 'pending') status = 'draft';
  else if (
    statusRaw === 'completed' ||
    statusRaw === 'ended' ||
    statusRaw === 'cancelled' ||
    statusRaw === 'archived'
  )
    status = 'ended';
  else if (statusRaw === 'published' || statusRaw === 'live') status = 'live';

  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? raw.name ?? 'Event'),
    editionLabel: String(raw.subtitle ?? raw.edition ?? raw.category ?? 'Edition'),
    date: String(raw.date ?? raw.event_date ?? new Date().toISOString()),
    venue: String(raw.venue ?? 'Primedia Rooftop'),
    status,
  };
}

export function zarFromCents(cents: number): number {
  return Math.round(cents) / 100;
}
