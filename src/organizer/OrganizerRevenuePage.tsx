import { useEffect, useState } from 'react';
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
import { formatPrice } from '../lib/mockTickets.ts';
import { useOrganizerEvent } from './OrganizerEventContext.tsx';

type ViewFilter = 'all' | 'by-type' | 'by-month';

export default function OrganizerRevenuePage() {
  const session = requireOrganizerSession();
  const { selectedEventId } = useOrganizerEvent();
  const [revenue, setRevenue] = useState<MockRevenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewFilter>('all');

  useEffect(() => {
    if (!selectedEventId) {
      setRevenue(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOrganizerRevenue(selectedEventId)
      .then(setRevenue)
      .finally(() => setLoading(false));
  }, [selectedEventId]);

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

  return (
    <OrganizerLayout session={session} title="Revenue">
      <OrganizerToolbar
        filters={
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
              By ticket type
            </h2>
            <OrganizerProgressList
              rows={revenue.byTicketType.map((row) => ({
                label: row.name,
                value: row.revenue,
                hint: `${row.sold} sold · ${formatZar(row.revenue)}`,
              }))}
              total={revenue.grossRevenue}
            />
            <ul className="mt-8 pt-6 border-t border-brand-border/60 space-y-3">
              {revenue.byTicketType.map((row) => (
                <li key={row.name} className="flex justify-between gap-4 text-sm">
                  <span className="text-brand-text font-medium">{row.name}</span>
                  <span className="font-serif text-lg tabular-nums shrink-0">R {formatPrice(row.revenue)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showMonth ? (
          <div className="organizer-surface rounded-sm p-7 md:p-9">
            <h2 className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent mb-8">
              By month
            </h2>
            <OrganizerBarChart
              bars={revenue.byMonth.map((row) => ({
                label: row.month.replace(/\s+\d{4}$/, ''),
                value: row.revenue,
                sublabel: formatZar(row.revenue),
              }))}
              formatValue={(n) => formatZar(n)}
            />
            <ul className="mt-8 space-y-3 border-t border-brand-border/60 pt-6">
              {revenue.byMonth.map((row) => (
                <li key={row.month} className="flex justify-between gap-4 text-sm">
                  <span className="text-brand-muted">{row.month}</span>
                  <span className="font-serif text-xl tabular-nums">R {formatPrice(row.revenue)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </OrganizerLayout>
  );
}
