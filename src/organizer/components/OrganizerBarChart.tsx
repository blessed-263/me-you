type Bar = { label: string; value: number; sublabel?: string };

type OrganizerBarChartProps = {
  bars: Bar[];
  formatValue?: (n: number) => string;
  className?: string;
};

export default function OrganizerBarChart({
  bars,
  formatValue = (n) => String(n),
  className = '',
}: OrganizerBarChartProps) {
  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className={`flex items-end gap-4 md:gap-6 h-44 px-1 ${className}`}>
      {bars.map((bar) => (
        <div key={bar.label} className="flex-1 flex flex-col items-center gap-3 h-full justify-end min-w-0">
          <div
            className="w-full max-w-[72px] bg-brand-accent rounded-t-[2px] min-h-[6px] transition-all shadow-sm"
            style={{ height: `${Math.max(8, Math.round((bar.value / max) * 100))}%` }}
            role="img"
            aria-label={`${bar.label}: ${formatValue(bar.value)}`}
          />
          <div className="text-center w-full">
            <p className="text-[10px] uppercase tracking-[0.14em] text-brand-muted truncate">{bar.label}</p>
            <p className="mt-1 text-sm font-medium tabular-nums text-brand-text">{formatValue(bar.value)}</p>
            {bar.sublabel ? (
              <p className="text-[10px] text-brand-muted tabular-nums">{bar.sublabel}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
