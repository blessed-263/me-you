import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, ArrowUpRight } from 'lucide-react';
import { formatShortDate, type MockEvent } from '../lib/mockTickets.ts';
import { ticketsPickHref } from '../lib/attendeeAuth.ts';
import { fetchPublicEvents } from '../lib/dataSource.ts';
import { isEventEnded, pickDefaultPublicEvent, sortPublicEvents } from '../lib/eventLifecycle.ts';
import {
  loadSelectedEventId,
  resolveEventIdFromUrl,
  saveSelectedEventId,
} from '../lib/mockCheckout.ts';
import { VENUE_MAPS_URL, VENUE_NAME } from '../lib/venue.ts';
import TicketsLayout from './TicketsLayout.tsx';
import TicketEventHero from './TicketEventHero.tsx';

function pickActiveEvent(events: MockEvent[]): MockEvent | null {
  if (events.length === 0) return null;
  const urlId = resolveEventIdFromUrl();
  if (urlId) {
    const found = events.find((e) => e.id === urlId);
    if (found) return found;
  }
  const saved = loadSelectedEventId();
  if (saved) {
    const found = events.find((e) => e.id === saved);
    if (found) return found;
  }
  return pickDefaultPublicEvent(events);
}

export default function TicketIntroStep() {
  const [events, setEvents] = useState<MockEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicEvents()
      .then((list) => {
        const sorted = sortPublicEvents(list);
        setEvents(sorted);
        const active = pickActiveEvent(sorted);
        if (active) saveSelectedEventId(active.id);
      })
      .catch((e: Error) => setError(e.message || 'Could not load events'))
      .finally(() => setLoading(false));
  }, []);

  const activeEvent = pickActiveEvent(events);
  const showPicker = events.length > 1 && !resolveEventIdFromUrl();

  if (loading) {
    return (
      <TicketsLayout step="select" backHref="/" backLabel="Home">
        <section className="px-5 md:px-12 py-20 max-w-[1400px] mx-auto text-center">
          <p className="text-sm text-brand-muted">Loading events…</p>
        </section>
      </TicketsLayout>
    );
  }

  if (error || events.length === 0) {
    return (
      <TicketsLayout step="select" backHref="/" backLabel="Home">
        <section className="px-5 md:px-12 py-20 max-w-[720px] mx-auto text-center">
          <p className="font-serif text-2xl text-brand-text">No events available</p>
          <p className="mt-3 text-sm text-brand-muted">
            {error || 'Check back soon for upcoming gatherings.'}
          </p>
        </section>
      </TicketsLayout>
    );
  }

  if (showPicker) {
    return (
      <TicketsLayout step="select" backHref="/" backLabel="Home">
        <section className="px-5 md:px-12 pt-8 md:pt-10 pb-16 max-w-[900px] mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-brand-text">Editions</h1>
          <p className="mt-3 text-sm font-light text-brand-muted">
            Upcoming gatherings and past editions from You & Me Africa.
          </p>
          <ul className="mt-10 space-y-4">
            {events.map((event) => {
              const ended = isEventEnded(event);
              return (
                <li key={event.id}>
                  <a
                    href={`/tickets?event=${encodeURIComponent(event.id)}`}
                    className={`block border p-6 transition-colors ${
                      ended
                        ? 'border-brand-border/70 bg-white/25 hover:bg-white/35'
                        : 'border-brand-border bg-white/40 hover:bg-white/60'
                    }`}
                    onClick={() => saveSelectedEventId(event.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-serif text-xl text-brand-text">{event.title}</p>
                      {ended ? (
                        <span className="text-[9px] uppercase tracking-[0.12em] font-semibold text-brand-muted border border-brand-border px-2 py-0.5">
                          Ended
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase tracking-[0.12em] font-semibold text-brand-accent">
                          On sale
                        </span>
                      )}
                    </div>
                    {event.subtitle ? (
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent">
                        {event.subtitle}
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm text-brand-muted">{formatShortDate(event.date)} · {event.venue}</p>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </TicketsLayout>
    );
  }

  const event = activeEvent!;

  return (
    <TicketsLayout step="select" backHref="/" backLabel="Home">
      <section className="px-5 md:px-12 pt-8 md:pt-10 pb-2 max-w-[1400px] mx-auto">
        <TicketEventHero
          event={event}
          inclusions={event.inclusions}
          pickHref={ticketsPickHref(event.id)}
        />
      </section>

      <section className="border-y border-brand-border bg-brand-surface/80">
        <div className="max-w-[1400px] mx-auto px-5 md:px-12 py-10 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
            <div className="flex flex-col items-center text-center gap-3">
              <Calendar className="w-5 h-5 text-brand-accent stroke-1" aria-hidden />
              <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">Date</p>
              <p className="font-serif text-2xl md:text-3xl text-brand-text">{formatShortDate(event.date)}</p>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <Clock className="w-5 h-5 text-brand-accent stroke-1" aria-hidden />
              <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">Time</p>
              <p className="font-serif text-2xl md:text-3xl text-brand-text">{event.timeLabel}</p>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <MapPin className="w-5 h-5 text-brand-accent stroke-1" aria-hidden />
              <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">Venue</p>
              <p className="font-serif text-2xl md:text-3xl text-brand-text">{event.venue || VENUE_NAME}</p>
              <a
                href={event.venueMapsUrl || VENUE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent hover:text-brand-text"
              >
                Directions
                <ArrowUpRight className="w-3 h-3" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>
    </TicketsLayout>
  );
}
