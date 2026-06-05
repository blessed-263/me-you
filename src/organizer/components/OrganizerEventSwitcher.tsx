import { CalendarDays, Radio } from 'lucide-react';
import { formatEditionDate } from '../../lib/eventEditions.ts';
import { publicTicketsHref } from '../../lib/organizerEventScope.ts';
import { useOrganizerEvent } from '../OrganizerEventContext.tsx';

export default function OrganizerEventSwitcher() {
  const { liveEditions, selectedEventId, setSelectedEventId } = useOrganizerEvent();

  if (liveEditions.length === 0) return null;

  return (
    <div className="organizer-event-switcher space-y-2" role="group" aria-label="Live events">
      <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted flex items-center gap-2">
        <Radio className="w-3 h-3 text-brand-accent" strokeWidth={2} aria-hidden />
        Live events
      </p>
      <ul className="space-y-2">
        {liveEditions.map((edition) => {
          const active = edition.id === selectedEventId;
          return (
            <li key={edition.id}>
              <button
                type="button"
                onClick={() => setSelectedEventId(edition.id)}
                className={`organizer-event-card w-full text-left rounded-sm border px-3.5 py-3 transition-all ${
                  active
                    ? 'organizer-event-card--active border-brand-accent/35 bg-brand-bg shadow-sm'
                    : 'border-brand-border/70 bg-brand-bg/50 hover:bg-brand-bg/80 hover:border-brand-border'
                }`}
                aria-pressed={active}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-serif text-[1.05rem] leading-snug text-brand-text text-balance">
                    {edition.title}
                  </span>
                  {edition.status === 'ended' ? (
                    <span className="shrink-0 mt-0.5 text-[9px] uppercase tracking-[0.12em] font-semibold text-brand-muted border border-brand-border px-2 py-0.5">
                      Ended
                    </span>
                  ) : edition.status === 'draft' ? (
                    <span className="shrink-0 mt-0.5 text-[9px] uppercase tracking-[0.12em] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5">
                      Draft
                    </span>
                  ) : active ? (
                    <span className="organizer-live-badge shrink-0 mt-0.5">Live</span>
                  ) : null}
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-accent">
                  {edition.editionLabel}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-brand-muted">
                  <CalendarDays className="w-3 h-3 shrink-0" aria-hidden />
                  {formatEditionDate(edition.date)}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
      {liveEditions.length === 1 ? (
        <p className="text-[10px] text-brand-muted leading-relaxed">
          Past editions stay listed here after they end.
        </p>
      ) : (
        <p className="text-[10px] text-brand-muted leading-relaxed">
          Switch between active editions. Ended and draft events stay off this list.
        </p>
      )}
    </div>
  );
}

export function OrganizerEventSwitcherMobile() {
  const { liveEditions, selectedEventId, setSelectedEventId } = useOrganizerEvent();

  if (liveEditions.length <= 1) return null;

  return (
    <div className="px-5 pb-3">
      <label htmlFor="org-mobile-event" className="sr-only">
        Live event
      </label>
      <select
        id="org-mobile-event"
        className="organizer-select w-full"
        value={selectedEventId ?? ''}
        onChange={(e) => setSelectedEventId(e.target.value)}
      >
        {liveEditions.map((e) => (
          <option key={e.id} value={e.id}>
            {e.editionLabel} · {formatEditionDate(e.date)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function useSelectedPublicTicketsHref(): string {
  const { selectedEdition } = useOrganizerEvent();
  if (!selectedEdition) return '/tickets';
  return publicTicketsHref(selectedEdition);
}
