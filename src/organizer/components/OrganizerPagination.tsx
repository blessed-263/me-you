import { ChevronLeft, ChevronRight } from 'lucide-react';

type OrganizerPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

export default function OrganizerPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
  itemLabel = 'items',
}: OrganizerPaginationProps) {
  if (totalPages <= 1 && totalItems === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-brand-border/60">
      <p className="text-[11px] uppercase tracking-[0.12em] text-brand-muted tabular-nums">
        Page {page} of {totalPages}
        {totalItems > 0 ? ` · ${totalItems} ${itemLabel}` : ''}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-full border border-brand-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text disabled:opacity-40 hover:bg-brand-surface/60"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-full border border-brand-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text disabled:opacity-40 hover:bg-brand-surface/60"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
