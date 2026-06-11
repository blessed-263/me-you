import { useCallback, useEffect, useMemo, useState } from 'react';
import { Label, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { chartColor } from './organizerChartColors.ts';
import OrganizerSelect from './OrganizerSelect.tsx';

type Segment = { label: string; value: number; color?: string };

type ChartRow = {
  key: string;
  label: string;
  value: number;
  fill: string;
};

type ChartSize = 'sm' | 'md' | 'lg';

const SIZE_PRESETS: Record<
  ChartSize,
  { innerRadius: number; maxWidth: number; activeBump: number; ringGap: number; ringWidth: number }
> = {
  sm: { innerRadius: 48, maxWidth: 220, activeBump: 8, ringGap: 12, ringWidth: 11 },
  md: { innerRadius: 60, maxWidth: 280, activeBump: 10, ringGap: 12, ringWidth: 13 },
  lg: { innerRadius: 72, maxWidth: 340, activeBump: 12, ringGap: 14, ringWidth: 15 },
};

type OrganizerDonutChartProps = {
  segments: Segment[];
  centerLabel?: string;
  size?: ChartSize;
  className?: string;
};

type SectorShapeProps = {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
  index?: number;
};

function segmentKey(label: string, index: number): string {
  const base =
    label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'segment';
  return `${base}-${index}`;
}

function buildChartRows(segments: Segment[]): ChartRow[] {
  return segments.map((seg, index) => ({
    key: segmentKey(seg.label, index),
    label: seg.label,
    value: seg.value,
    fill: seg.color ?? chartColor(index),
  }));
}

export default function OrganizerDonutChart({
  segments,
  centerLabel = 'Tickets',
  size = 'md',
  className = '',
}: OrganizerDonutChartProps) {
  const chartData = useMemo(() => buildChartRows(segments), [segments]);
  const preset = SIZE_PRESETS[size];
  const total = chartData.reduce((sum, row) => sum + row.value, 0);

  const [activeKey, setActiveKey] = useState(() => chartData[0]?.key ?? '');

  useEffect(() => {
    if (!chartData.some((row) => row.key === activeKey)) {
      setActiveKey(chartData[0]?.key ?? '');
    }
  }, [chartData, activeKey]);

  const activeIndex = useMemo(
    () => Math.max(0, chartData.findIndex((row) => row.key === activeKey)),
    [chartData, activeKey],
  );

  const activeRow = chartData[activeIndex];
  const activePct = total > 0 && activeRow ? Math.round((activeRow.value / total) * 100) : 0;

  const renderPieShape = useCallback(
    ({ index, outerRadius = 0, ...props }: SectorShapeProps) => {
      if (index === activeIndex) {
        return (
          <g>
            <Sector {...props} outerRadius={outerRadius + preset.activeBump} />
            <Sector
              {...props}
              outerRadius={outerRadius + preset.activeBump + preset.ringWidth}
              innerRadius={outerRadius + preset.ringGap}
            />
          </g>
        );
      }

      return <Sector {...props} outerRadius={outerRadius} />;
    },
    [activeIndex, preset.activeBump, preset.ringGap, preset.ringWidth],
  );

  if (chartData.length === 0) return null;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {chartData.length > 1 ? (
        <div className="flex justify-end">
          <OrganizerSelect
            label="Ticket type"
            value={activeKey}
            onChange={(event) => setActiveKey(event.target.value)}
            options={chartData.map((row) => ({
              value: row.key,
              label: row.label,
            }))}
            className="max-w-[11rem] text-[11px]"
          />
        </div>
      ) : null}

      <div
        className="organizer-chart-pie mx-auto aspect-square w-full"
        style={{ maxWidth: preset.maxWidth }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as ChartRow | undefined;
                if (!row) return null;
                const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                return (
                  <div className="organizer-chart-tooltip">
                    <p className="font-medium text-brand-text">{row.label}</p>
                    <p className="mt-0.5 tabular-nums text-brand-muted">
                      {row.value.toLocaleString()} ({pct}%)
                    </p>
                  </div>
                );
              }}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius={preset.innerRadius}
              strokeWidth={5}
              stroke="var(--color-brand-bg)"
              shape={renderPieShape}
              onClick={(_, index) => {
                const row = chartData[index];
                if (row) setActiveKey(row.key);
              }}
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox) || !activeRow) {
                    return null;
                  }

                  const cx = viewBox.cx ?? 0;
                  const cy = viewBox.cy ?? 0;

                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={cx}
                        y={cy}
                        fill="var(--color-brand-text)"
                        fontFamily="var(--font-serif)"
                        fontSize={28}
                        fontWeight={600}
                      >
                        {activeRow.value.toLocaleString()}
                      </tspan>
                      <tspan
                        x={cx}
                        y={cy + 22}
                        fill="var(--color-brand-muted)"
                        fontSize={10}
                        letterSpacing="0.12em"
                      >
                        {centerLabel.toUpperCase()}
                      </tspan>
                      <tspan x={cx} y={cy + 38} fill="var(--color-brand-text)" fontSize={11}>
                        {activeRow.label}
                        {chartData.length > 1 ? ` · ${activePct}%` : ''}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="grid gap-1.5 sm:grid-cols-2">
        {chartData.map((row, index) => {
          const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
          const isActive = index === activeIndex;

          return (
            <li key={row.key}>
              <button
                type="button"
                onClick={() => setActiveKey(row.key)}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[11px] leading-tight transition-colors ${
                  isActive
                    ? 'bg-brand-accent/10 ring-1 ring-brand-accent/25'
                    : 'hover:bg-brand-surface/60'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: row.fill }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-brand-text" title={row.label}>
                  {row.label}
                </span>
                <span className="shrink-0 tabular-nums text-brand-muted whitespace-nowrap">
                  {row.value} ({pct}%)
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
