import { formatEditionDate } from '../../lib/eventEditions.ts';
import type { EventEdition } from '../../lib/eventEditions.ts';

type OrganizerEventGroupHeaderProps = {
  title: string;
  editionLabel: string;
  date: string;
  status: EventEdition['status'];
  count: number;
  countLabel: string;
};

export default function OrganizerEventGroupHeader({
  title,
  editionLabel,
  date,
  status,
  count,
  countLabel,
}: OrganizerEventGroupHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-3 border-b border-brand-border/70">
      <div>
        <p className="font-serif text-xl text-brand-text">{title}</p>
        {editionLabel ? (
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent">
            {editionLabel}
          </p>
        ) : null}
        {date ? (
          <p className="mt-1 text-[11px] text-brand-muted">{formatEditionDate(date)}</p>
        ) : null}
      </div>
      <div className="text-right shrink-0">
        {status === 'ended' ? (
          <span className="text-[9px] uppercase tracking-[0.12em] font-semibold text-brand-muted border border-brand-border px-2 py-0.5">
            Ended
          </span>
        ) : status === 'draft' ? (
          <span className="text-[9px] uppercase tracking-[0.12em] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5">
            Draft
          </span>
        ) : (
          <span className="organizer-live-badge">Live</span>
        )}
        <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-brand-muted tabular-nums">
          {count} {countLabel}
        </p>
      </div>
    </div>
  );
}
