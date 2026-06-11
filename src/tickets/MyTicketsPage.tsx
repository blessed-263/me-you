import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2, Ticket } from 'lucide-react';
import { attendeeDisplayName, loadAttendeeSession, ticketsPickHref } from '../lib/attendeeAuth.ts';
import { fetchAttendeeTickets } from '../lib/dataSource.ts';
import { VENUE_ADDRESS_ONE_LINE } from '../lib/venue.ts';
import { ticketPartFromType } from '../lib/ticketVisuals.ts';
import type { UserTicketView } from '../lib/storeApi.ts';
import { TICKETS_BASE } from '../lib/mockCheckout.ts';
import TicketsLayout from './TicketsLayout.tsx';

const STATUS_LABEL: Record<string, string> = {
  active: 'Valid',
  used: 'Checked in',
  cancelled: 'Cancelled',
  completed: 'Paid',
  pending: 'Pending payment',
};

type TicketGroup = {
  reference: string;
  eventTitle: string;
  editionLabel: string;
  eventDateLabel: string;
  venueLabel: string;
  tickets: UserTicketView[];
};

function groupTickets(tickets: UserTicketView[]): TicketGroup[] {
  const map = new Map<string, TicketGroup>();
  for (const t of tickets) {
    const ref = t.orderReference || t.id;
    const existing = map.get(ref);
    if (existing) {
      existing.tickets.push(t);
    } else {
      map.set(ref, {
        reference: ref,
        eventTitle: t.eventTitle,
        editionLabel: t.editionLabel,
        eventDateLabel: t.eventDate,
        venueLabel: VENUE_ADDRESS_ONE_LINE,
        tickets: [t],
      });
    }
  }
  return [...map.values()];
}

export default function MyTicketsPage() {
  const session = loadAttendeeSession();
  const [tickets, setTickets] = useState<UserTicketView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const groups = useMemo(() => groupTickets(tickets), [tickets]);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchAttendeeTickets(session.email)
      .then((list) => {
        setTickets(list);
        setExpandedRef(list[0]?.orderReference ?? null);
      })
      .catch((e: Error) => setError(e.message || 'Could not load tickets'))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return null;

  return (
    <TicketsLayout step="select" backHref={TICKETS_BASE} backLabel="Event" showSteps={false}>
      <section className="px-5 md:px-12 py-10 md:py-14 max-w-[800px] mx-auto">
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent">My tickets</p>
        <h1 className="mt-3 font-serif text-3xl md:text-4xl font-semibold text-brand-text">
          {attendeeDisplayName(session)}
        </h1>
        <p className="mt-2 text-sm text-brand-muted">{session.email}</p>

        {loading ? (
          <div className="mt-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-accent" aria-hidden />
            <p className="mt-3 text-sm text-brand-muted">Loading your tickets…</p>
          </div>
        ) : error ? (
          <p className="mt-12 text-sm text-red-700/90" role="alert">{error}</p>
        ) : groups.length === 0 ? (
          <div className="mt-12 border border-brand-border bg-white/50 p-10 text-center">
            <Ticket className="w-8 h-8 mx-auto text-brand-accent mb-4" strokeWidth={1.25} aria-hidden />
            <p className="font-serif text-xl text-brand-text">No tickets yet</p>
            <p className="mt-2 text-sm text-brand-muted max-w-sm mx-auto leading-relaxed">
              When you complete a purchase while signed in with this email, your tickets will show up here.
            </p>
            <a
              href={ticketsPickHref()}
              className="mt-8 inline-flex rounded-full px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90"
            >
              Get tickets
            </a>
          </div>
        ) : (
          <ul className="mt-10 space-y-3">
            {groups.map((group) => {
              const open = expandedRef === group.reference;
              return (
                <li
                  key={group.reference}
                  className={`border border-brand-border bg-white overflow-hidden transition-shadow ${
                    open ? 'shadow-md' : 'shadow-sm'
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left px-5 py-4 hover:bg-brand-surface/40 transition-colors"
                    onClick={() => setExpandedRef((r) => (r === group.reference ? null : group.reference))}
                    aria-expanded={open}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-serif text-xl text-brand-text">{group.eventTitle}</p>
                        {group.editionLabel ? (
                          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-accent mt-1">
                            {group.editionLabel}
                          </p>
                        ) : null}
                        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-brand-muted">
                          <CalendarDays className="w-3.5 h-3.5" aria-hidden />
                          {group.eventDateLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[11px] text-brand-accent">{group.reference}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-brand-muted">
                          {group.tickets.length} ticket{group.tickets.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                  </button>
                  {open ? (
                    <div className="border-t border-brand-border px-5 py-4 bg-brand-bg/40 space-y-4">
                      <ul className="space-y-3">
                        {group.tickets.map((t) => (
                          <li
                            key={t.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-brand-border/50 pb-3 last:border-0 last:pb-0"
                          >
                            <div>
                              <p className="text-brand-text font-medium">{t.holderName}</p>
                              <p className="text-[12px] text-brand-muted">{t.ticketType}</p>
                              <p className="text-[10px] uppercase tracking-[0.12em] text-brand-accent mt-1">{ticketPartFromType(t.ticketType)}</p>
                              <p className="text-[11px] text-brand-muted">{group.venueLabel}</p>
                              <p className="font-mono text-[10px] text-brand-muted mt-1">{t.id}</p>
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-accent">
                              {STATUS_LABEL[t.status] ?? t.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-10 text-center">
          <a
            href={ticketsPickHref()}
            className="text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent hover:text-brand-text"
          >
            Purchase more tickets →
          </a>
        </p>
      </section>
    </TicketsLayout>
  );
}
