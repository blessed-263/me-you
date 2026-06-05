import { useEffect, useMemo, useState } from 'react';
import OrganizerLayout from './OrganizerLayout.tsx';
import OrganizerBarChart from './components/OrganizerBarChart.tsx';
import OrganizerExportMenu from './components/OrganizerExportMenu.tsx';
import OrganizerProgressList from './components/OrganizerProgressList.tsx';
import OrganizerSelect from './components/OrganizerSelect.tsx';
import OrganizerToolbar from './components/OrganizerToolbar.tsx';
import { requireOrganizerSession } from '../lib/organizerAuth.ts';
import { exportRevenueCsv, exportRevenueJson, formatZar } from '../lib/organizerExportData.ts';
import { fetchOrganizerRevenue } from '../lib/dataSource.ts';
import type { MockRevenue } from '../lib/mockOrganizer.ts';
import {
  type DashboardPeriod,
  formatDashboardMonthLabel,
  normalizeMonthlySales,
} from '../lib/organizerListUtils.ts';
import { formatPrice } from '../lib/mockTickets.ts';
import { useOrganizerEvent } from './OrganizerEventContext.tsx';

type ViewFilter = 'all' | 'by-type' | 'by-month';
type RevenuePeriod = DashboardPeriod | 'all';

export default function OrganizerRevenuePage() {
  const session = requireOrganizerSession();
  const { selectedEventId, selectedEdition } = useOrganizerEvent();
  const [revenue, setRevenue] = useState<MockRevenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewFilter>('all');
  const [period, setPeriod] = useState<RevenuePeriod>('all');

  useEffect(() => {
    if (!selectedEventId) {
      setRevenue(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOrganizerRevenue(selectedEventId, period)
      .then(setRevenue)
      .finally(() => setLoading(false));
  }, [selectedEventId, period]);

  const monthlyRows = useMemo(
    () => normalizeMonthlySales(revenue?.byMonth.map((row) => ({ month: row.month, amount: row.revenue })) ?? []),
    [revenue],
  );

  const ticketTypeRows = useMemo(
    () =>
      [...(revenue?.byTicketType ?? [])]
        .filter((row) => row.revenue > 0 || row.sold > 0)
        .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name)),
    [revenue],
  );

  if (!session || !selectedEventId) return null;
  if (loading) {
    return (
      <OrganizerLayout session={session} title="Revenue">
        <p className="text-sm text-brand-muted">Loading revenue…</p>
      </OrganizerLayout>
    );
  }
  if (!revenue) return null;

  const showType = view === 'all' || view === 'by-type';
  const showMonth = view === 'all' || view === 'by-month';
  const editionLabel = selectedEdition?.editionLabel ?? 'Edition';

  return (
    <OrganizerLayout session={session} title="Revenue">
      <OrganizerToolbar
        filters={
          <>
            <OrganizerSelect
              label="Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as RevenuePeriod)}
              options={[
                { value: 'all', label: 'All time' },
                { value: '6months', label: 'Last 6 months' },
                { value: 'year', label: 'Last 12 months' },
              ]}
            />
            <OrganizerSelect
              label="View"
              value={view}
              onChange={(e) => setView(e.target.value as ViewFilter)}
              options={[
                { value: 'all', label: 'Full breakdown' },
                { value: 'by-type', label: 'By ticket type' },
                { value: 'by-month', label: 'By month' },
              ]}
            />
          </>
        }
        actions={
          <OrganizerExportMenu
            actions={[
              { id: 'csv', label: 'Export CSV', onClick: () => exportRevenueCsv(revenue) },
              { id: 'json', label: 'Export JSON', onClick: () => exportRevenueJson(revenue) },
            ]}
          />
        }
      />

      <p className="text-[11px] uppercase tracking-[0.12em] text-brand-muted mb-6 -mt-2">
        {selectedEdition?.title ?? 'Event'} · {editionLabel}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-10">
        <div className="organizer-stat rounded-sm p-6 md:p-7">
          <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-brand-muted">Gross revenue</p>
          <p className="mt-3 font-serif text-3xl tabular-nums">R {formatPrice(revenue.grossRevenue)}</p>
        </div>
        <div className="organizer-stat rounded-sm p-6 md:p-7">
          <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-brand-muted">
            Platform fee ({revenue.platformFeePercent}%)
          </p>
          <p className="mt-3 font-serif text-3xl tabular-nums text-brand-muted">
            R {formatPrice(revenue.platformFee)}
          </p>
        </div>
        <div className="organizer-stat organizer-stat--featured rounded-sm p-6 md:p-7">
          <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-brand-accent">Net revenue</p>
          <p className="mt-3 font-serif text-3xl tabular-nums text-brand-text">
            R {formatPrice(revenue.netRevenue)}
          </p>
        </div>
      </div>

      <div className={`grid gap-5 md:gap-6 ${showType && showMonth ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {showType ? (
          <div className="organizer-surface rounded-sm p-7 md:p-9">
            <h2 className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent mb-6">
              By ticket type · {editionLabel}
            </h2>
            {ticketTypeRows.length > 0 ? (
              <>
                <OrganizerProgressList
                  rows={ticketTypeRows.map((row) => ({
                    label: row.name,
                    value: row.revenue,
                    hint: `${row.sold} sold · ${formatZar(row.revenue)}`,
                  }))}
                  total={revenue.grossRevenue}
                />
              </>
            ) : (
              <p className="text-sm text-brand-muted">No ticket revenue for this period.</p>
            )}
          </div>
        ) : null}

        {showMonth ? (
          <div className="organizer-surface rounded-sm p-7 md:p-9">
            <h2 className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent mb-8">
              By month · {editionLabel}
            </h2>
            {monthlyRows.length > 0 ? (
              <>
                <OrganizerBarChart
                  bars={monthlyRows.map((row) => ({
                    id: row.month,
                    label: formatDashboardMonthLabel(row.month),
                    value: row.amount,
                  }))}
                  formatValue={(n) => formatZar(n)}
                />
                <ul className="mt-8 space-y-3 border-t border-brand-border/60 pt-6">
                  {monthlyRows.map((row) => (
                    <li key={row.month} className="flex justify-between gap-4 text-sm">
                      <span className="text-brand-muted">{formatDashboardMonthLabel(row.month)}</span>
                      <span className="font-serif text-xl tabular-nums">R {formatPrice(row.amount)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-brand-muted">No sales for this period.</p>
            )}
          </div>
        ) : null}
      </div>
    </OrganizerLayout>
  );
}
