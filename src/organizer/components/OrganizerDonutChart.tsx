type Segment = { label: string; value: number; color?: string };

const PALETTE = ['#5a5a40', '#8a8a6a', '#b8b09a', '#d4cbb8', '#6b6b5d'];

type OrganizerDonutChartProps = {
  segments: Segment[];
  centerLabel?: string;
  centerValue?: string;
};

export default function OrganizerDonutChart({ segments, centerLabel, centerValue }: OrganizerDonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cursor = 0;
  const stops: string[] = [];

  segments.forEach((seg, i) => {
    const pct = (seg.value / total) * 100;
    const color = seg.color ?? PALETTE[i % PALETTE.length];
    const start = cursor;
    cursor += pct;
    stops.push(`${color} ${start}% ${cursor}%`);
  });

  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : '#ebe6dc';

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="relative shrink-0 w-36 h-36 md:w-40 md:h-40">
        <div
          className="w-full h-full rounded-full organizer-chart-donut"
          style={{ background: gradient }}
          role="img"
          aria-label="Distribution chart"
        />
        <div className="absolute inset-[22%] rounded-full bg-white flex flex-col items-center justify-center text-center px-2">
          {centerValue ? (
            <p className="font-serif text-xl tabular-nums text-brand-text leading-none">{centerValue}</p>
          ) : null}
          {centerLabel ? (
            <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-brand-muted">{centerLabel}</p>
          ) : null}
        </div>
      </div>
      <ul className="flex-1 w-full space-y-3">
        {segments.map((seg, i) => {
          const pct = Math.round((seg.value / total) * 100);
          const color = seg.color ?? PALETTE[i % PALETTE.length];
          return (
            <li key={`${seg.label}-${i}`} className="flex items-center gap-3 text-sm">
              <span className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
              <span className="flex-1 text-brand-text font-medium truncate">{seg.label}</span>
              <span className="tabular-nums text-brand-muted shrink-0">
                {seg.value} <span className="text-[10px]">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
