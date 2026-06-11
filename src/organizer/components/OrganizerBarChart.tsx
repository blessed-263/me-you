import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartColor } from './organizerChartColors.ts';

type BarRow = { id?: string; label: string; value: number; sublabel?: string; color?: string };

type ChartSize = 'sm' | 'md' | 'lg';

const ROW_HEIGHT: Record<ChartSize, number> = {
  sm: 34,
  md: 44,
  lg: 52,
};

type ChartDataRow = {
  key: string;
  label: string;
  value: number;
  fill: string;
};

type OrganizerBarChartProps = {
  bars: BarRow[];
  formatValue?: (n: number) => string;
  size?: ChartSize;
  className?: string;
};

function buildChartData(bars: BarRow[]): ChartDataRow[] {
  return bars.map((bar, index) => {
    const label = bar.label?.trim() || '—';
    return {
      key: bar.id ?? `${label}-${index}`,
      label,
      value: bar.value,
      fill: bar.color ?? chartColor(index),
    };
  });
}

export default function OrganizerBarChart({
  bars,
  formatValue = (n) => String(n),
  size = 'md',
  className = '',
}: OrganizerBarChartProps) {
  const chartData = useMemo(() => buildChartData(bars), [bars]);

  const chartHeight = useMemo(
    () => Math.max(120, chartData.length * ROW_HEIGHT[size] + 16),
    [chartData.length, size],
  );

  const yAxisWidth = useMemo(() => {
    const maxLen = Math.max(...chartData.map((row) => row.label.length), 4);
    return Math.min(128, Math.max(56, maxLen * 7));
  }, [chartData]);

  if (chartData.length === 0) return null;

  return (
    <div className={`organizer-chart-bar w-full ${className}`}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
          barCategoryGap="18%"
        >
          <YAxis
            dataKey="label"
            type="category"
            width={yAxisWidth}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{
              fill: 'var(--color-brand-muted)',
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
            }}
          />
          <XAxis dataKey="value" type="number" hide domain={[0, 'dataMax']} />
          <Tooltip
            cursor={{ fill: 'color-mix(in srgb, var(--color-brand-accent) 8%, transparent)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as ChartDataRow | undefined;
              if (!row) return null;

              return (
                <div className="organizer-chart-tooltip">
                  <p className="font-medium text-brand-text">{row.label}</p>
                  <p className="mt-0.5 tabular-nums text-brand-muted">{formatValue(row.value)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
