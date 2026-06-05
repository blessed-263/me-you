import { useEffect, useState } from 'react';
import OrganizerLayout from './OrganizerLayout.tsx';
import OrganizerBarChart from './components/OrganizerBarChart.tsx';
import OrganizerDonutChart from './components/OrganizerDonutChart.tsx';
import OrganizerProgressList from './components/OrganizerProgressList.tsx';
import OrganizerExportMenu from './components/OrganizerExportMenu.tsx';
import OrganizerSelect from './components/OrganizerSelect.tsx';
import OrganizerToolbar from './components/OrganizerToolbar.tsx';
import { requireOrganizerSession } from '../lib/organizerAuth.ts';
import { exportDashboardCsv, exportDashboardMonthlyCsv, formatZar } from '../lib/organizerExportData.ts';
import { fetchDashboardStats } from '../lib/dataSource.ts';
import type { MockDashboardStats } from '../lib/mockOrganizer.ts';
import { useOrganizerEvent } from './OrganizerEventContext.tsx';

type PeriodFilter = 'all' | 'apr' | 'may';

export default function OrganizerDashboardPage() {
  const session = requireOrganizerSession();
  const { selectedEventId } = useOrganizerEvent();
  const [stats, setStats] = useState<MockDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('all');

  useEffect(() => {
    if (!selectedEventId) {
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDashboardStats(selectedEventId)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  if (!session || !selectedEventId) return null;
  if (loading) {
    return (
      <OrganizerLayout session={session} title="Dashboard">
        <p className="text-sm text-brand-muted">Loading dashboard…</p>
      </OrganizerLayout>
    );
  }
  if (!stats) return null;

  const monthlyFiltered =
    period === 'all'
      ? stats.monthlySales
      : stats.monthlySales.filter((m) => m.month.toLowerCase().startsWith(period === 'apr' ? 'apr' : 'may'));

  const statCards = [
    { label: 'Revenue', value: formatZar(stats.revenueTotal), featured: true },
    { label: 'Tickets sold', value: String(stats.ticketsSold), featured: false },
    { label: 'Active tickets', value: String(stats.ticketsActive), featured: false },
    { label: 'Check-in rate', value: `${stats.checkInRate}%`, featured: false },
  ];

  return (
    <OrganizerLayout session={session} title="Dashboard">
      <OrganizerToolbar
        filters={
          <OrganizerSelect
            label="Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            options={[
              { value: 'all', label: 'All months' },
              { value: 'apr', label: 'April' },
              { value: 'may', label: 'May' },
            ]}
          />
        }
        actions={
          <OrganizerExportMenu
            actions={[
              { id: 'summary', label: 'Summary CSV', onClick: () => exportDashboardCsv(stats) },
              {
                id: 'monthly',
                label: 'Sales by month CSV',
                onClick: () => exportDashboardMonthlyCsv(stats),
              },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 mb-8 md:mb-10">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`organizer-stat rounded-sm p-6 md:p-7 ${card.featured ? 'organizer-stat--featured' : ''}`}
          >
            <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-brand-muted">{card.label}</p>
            <p className="mt-3 font-serif text-3xl md:text-[2.125rem] tabular-nums text-brand-text leading-none">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div className="organizer-surface rounded-sm p-7 md:p-9">
          <h2 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent mb-8">
            Sales by month
          </h2>
          {monthlyFiltered.length > 0 ? (
            <OrganizerBarChart
              bars={monthlyFiltered.map((m) => ({
                label: m.month,
                value: m.amount,
                sublabel: formatZar(m.amount),
              }))}
              formatValue={(n) => formatZar(n)}
            />
          ) : (
            <p className="text-sm text-brand-muted">No sales for this period.</p>
          )}
        </div>

        <div className="organizer-surface rounded-sm p-7 md:p-9">
          <h2 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent mb-8">
            By ticket type
          </h2>
          <OrganizerDonutChart
            segments={stats.ticketTypeDistribution.map((row) => ({
              label: row.name,
              value: row.count,
            }))}
            centerValue={String(stats.ticketsSold)}
            centerLabel="Tickets"
          />
        </div>
      </div>

      <div className="organizer-surface rounded-sm p-7 md:p-9 mt-5 md:mt-6">
        <h2 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent mb-6">
          Ticket mix
        </h2>
        <OrganizerProgressList
          rows={stats.ticketTypeDistribution.map((row) => ({ label: row.name, value: row.count }))}
          total={stats.ticketsSold}
        />
      </div>
    </OrganizerLayout>
  );
}
