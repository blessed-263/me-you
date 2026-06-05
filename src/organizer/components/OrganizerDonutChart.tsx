import { chartColor } from './organizerChartColors.ts';

type Segment = { label: string; value: number; color?: string };

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
    const color = seg.color ?? chartColor(i);
    const start = cursor;
    cursor += pct;
    stops.push(`${color} ${start}% ${cursor}%`);
  });

  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : '#ebe6dc';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32 mx-auto sm:mx-0">
        <div
          className="w-full h-full rounded-full organizer-chart-donut"
          style={{ background: gradient }}
          role="img"
          aria-label="Distribution chart"
        />
        <div className="absolute inset-[22%] rounded-full bg-white flex flex-col items-center justify-center text-center px-1.5">
          {centerValue ? (
            <p className="font-serif text-base sm:text-lg tabular-nums text-brand-text leading-none">{centerValue}</p>
          ) : null}
          {centerLabel ? (
            <p className="mt-0.5 text-[7px] uppercase tracking-[0.1em] text-brand-muted leading-tight">
              {centerLabel}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="flex-1 w-full min-w-0 space-y-1.5">
        {segments.map((seg, i) => {
          const pct = Math.round((seg.value / total) * 100);
          const color = seg.color ?? chartColor(i);
          return (
            <li key={`${seg.label}-${i}`} className="flex items-center gap-2 min-w-0 text-[11px] leading-tight">
              <span
                className="w-2 h-2 shrink-0 rounded-full"
                style={{ background: color }}
                aria-hidden
              />
              <p className="flex-1 min-w-0 truncate text-brand-text" title={seg.label}>
                {seg.label}
              </p>
              <p className="shrink-0 tabular-nums text-brand-muted whitespace-nowrap">
                {seg.value} ({pct}%)
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
