import type { ReactNode } from 'react';

type OrganizerToolbarProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  resultCount?: number;
  resultLabel?: string;
  actions?: ReactNode;
};

export default function OrganizerToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  resultCount,
  resultLabel = 'results',
  actions,
}: OrganizerToolbarProps) {
  return (
    <div className="organizer-toolbar mb-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
        <div className="flex flex-col sm:flex-row flex-1 gap-3 min-w-0">
          {onSearchChange !== undefined ? (
            <input
              type="search"
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="rsvp-field flex-1 min-w-0 max-w-xl"
            />
          ) : null}
          {filters ? <div className="flex flex-wrap items-center gap-2 sm:gap-3">{filters}</div> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
          {resultCount !== undefined ? (
            <p className="text-[11px] uppercase tracking-[0.12em] text-brand-muted tabular-nums">
              {resultCount} {resultLabel}
            </p>
          ) : null}
          {actions}
        </div>
      </div>
    </div>
  );
}
