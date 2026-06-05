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
  const hasSearch = onSearchChange !== undefined;

  return (
    <div className="organizer-toolbar mb-6">
      <div className="flex flex-col gap-3 lg:gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          {hasSearch ? (
            <div className="w-full lg:w-auto lg:flex-1 lg:max-w-sm xl:max-w-md shrink-0">
              <input
                type="search"
                value={search ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="organizer-search-input"
              />
            </div>
          ) : null}

          {filters ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {filters}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 shrink-0 lg:ml-auto">
            {resultCount !== undefined ? (
              <p className="text-[11px] uppercase tracking-[0.12em] text-brand-muted tabular-nums whitespace-nowrap">
                {resultCount} {resultLabel}
              </p>
            ) : null}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
