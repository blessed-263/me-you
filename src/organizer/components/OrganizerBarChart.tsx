import { chartColor } from './organizerChartColors.ts';

type Bar = { id?: string; label: string; value: number; sublabel?: string; color?: string };

type OrganizerBarChartProps = {
  bars: Bar[];
  formatValue?: (n: number) => string;
  className?: string;
};

const BAR_AREA_PX = 120;
const BAR_WIDTH_PX = 36;
const COLUMN_WIDTH_PX = 72;

export default function OrganizerBarChart({
  bars,
  formatValue = (n) => String(n),
  className = '',
}: OrganizerBarChartProps) {
  if (bars.length === 0) return null;

  const max = Math.max(...bars.map((b) => b.value), 1);
  const scrollable = bars.length > 4;

  return (
    <div className={`w-full ${scrollable ? 'overflow-x-auto pb-1' : ''} ${className}`}>
      <div
        className={`flex items-end gap-3 sm:gap-4 ${
          bars.length === 1 ? 'justify-center' : scrollable ? 'justify-start min-w-max px-1' : 'justify-between'
        }`}
        style={{ minHeight: BAR_AREA_PX + 56 }}
      >
        {bars.map((bar, index) => {
          const color = bar.color ?? chartColor(index);
          const formatted = formatValue(bar.value);
          const label = bar.label?.trim() || '—';
          const barHeight = Math.max(4, Math.round((bar.value / max) * BAR_AREA_PX));

          return (
            <div
              key={bar.id ?? `${label}-${index}`}
              className="flex flex-col items-center shrink-0"
              style={{ width: COLUMN_WIDTH_PX }}
            >
              <p className="text-[11px] sm:text-xs font-medium tabular-nums text-brand-text mb-2 text-center leading-tight w-full">
                {formatted}
              </p>

              <div
                className="flex items-end justify-center w-full"
                style={{ height: BAR_AREA_PX }}
              >
                <div
                  className="rounded-t-[2px] shadow-sm transition-all"
                  style={{
                    width: BAR_WIDTH_PX,
                    height: barHeight,
                    backgroundColor: color,
                  }}
                  role="img"
                  aria-label={`${label}: ${formatted}`}
                />
              </div>

              <p
                className="mt-2 text-[10px] sm:text-[11px] text-brand-muted text-center leading-snug w-full px-0.5"
                title={label}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
