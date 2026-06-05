import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export type OrganizerExpandableItem<T> = {
  id: string;
  data: T;
  summary: ReactNode;
  details: ReactNode;
};

type OrganizerExpandableListProps<T> = {
  items: OrganizerExpandableItem<T>[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  emptyMessage?: string;
};

export default function OrganizerExpandableList<T>({
  items,
  expandedId,
  onToggle,
  emptyMessage = 'No items match your filters.',
}: OrganizerExpandableListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="organizer-surface rounded-sm p-10 text-center text-sm text-brand-muted">{emptyMessage}</div>
    );
  }

  return (
    <div className="organizer-expandable-list space-y-2">
      {items.map((item) => {
        const open = expandedId === item.id;
        return (
          <div
            key={item.id}
            className={`organizer-expandable rounded-sm border border-brand-border/80 bg-white overflow-hidden transition-shadow ${
              open ? 'organizer-expandable--open shadow-md' : 'shadow-sm'
            }`}
          >
            <button
              type="button"
              className="organizer-expandable__trigger w-full flex items-center gap-3 px-4 py-3.5 md:px-5 text-left"
              onClick={() => onToggle(item.id)}
              aria-expanded={open}
            >
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-brand-accent transition-transform ${open ? 'rotate-180' : ''}`}
                aria-hidden
              />
              <div className="flex-1 min-w-0">{item.summary}</div>
            </button>
            {open ? (
              <div className="organizer-expandable__panel border-t border-brand-border/70 px-4 py-4 md:px-5 md:py-5 bg-brand-bg/30 text-sm">
                {item.details}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
