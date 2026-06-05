import { chartColor } from './organizerChartColors.ts';

type Row = { label: string; value: number; hint?: string; color?: string };

type OrganizerProgressListProps = {
  rows: Row[];
  total?: number;
};

export default function OrganizerProgressList({ rows, total }: OrganizerProgressListProps) {
  const sum = total ?? (rows.reduce((s, r) => s + r.value, 0) || 1);

  return (
    <ul className="space-y-4 sm:space-y-5">
      {rows.map((row, index) => {
        const pct = sum > 0 ? Math.round((row.value / sum) * 100) : 0;
        const color = row.color ?? chartColor(index);

        return (
          <li key={`${row.label}-${index}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm mb-2">
              <div className="flex items-start gap-2 min-w-0 flex-1 basis-[12rem]">
                <span
                  className="w-2 h-2 shrink-0 rounded-full mt-1.5"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <span
                    className="text-brand-text font-medium text-[13px] leading-snug break-words"
                    title={row.label}
                  >
                    {row.label}
                  </span>
                  {row.hint ? (
                    <p className="text-[11px] text-brand-muted mt-0.5 leading-snug">{row.hint}</p>
                  ) : null}
                </div>
              </div>
              <span className="tabular-nums text-brand-muted shrink-0 text-[13px]">
                {row.value}
                <span className="text-[10px] ml-1">({pct}%)</span>
              </span>
            </div>
            <div className="h-1.5 bg-[#ebe6dc] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
