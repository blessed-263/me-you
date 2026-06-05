type Row = { label: string; value: number; hint?: string };

type OrganizerProgressListProps = {
  rows: Row[];
  total?: number;
};

export default function OrganizerProgressList({ rows, total }: OrganizerProgressListProps) {
  const sum = total ?? (rows.reduce((s, r) => s + r.value, 0) || 1);

  return (
    <ul className="space-y-5">
      {rows.map((row) => {
        const pct = sum > 0 ? Math.round((row.value / sum) * 100) : 0;
        return (
          <li key={row.label}>
            <div className="flex justify-between text-sm mb-2 gap-3">
              <div className="min-w-0">
                <span className="text-brand-text font-medium">{row.label}</span>
                {row.hint ? <p className="text-[11px] text-brand-muted mt-0.5">{row.hint}</p> : null}
              </div>
              <span className="tabular-nums text-brand-muted shrink-0">{row.value}</span>
            </div>
            <div className="h-1 bg-[#ebe6dc] rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-accent rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
