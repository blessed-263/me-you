import { useEffect, useMemo, useState } from 'react';
import OrganizerLayout from './OrganizerLayout.tsx';
import OrganizerBarChart from './components/OrganizerBarChart.tsx';
import OrganizerDonutChart from './components/OrganizerDonutChart.tsx';
import OrganizerExportMenu from './components/OrganizerExportMenu.tsx';
import OrganizerEventGroupHeader from './components/OrganizerEventGroupHeader.tsx';
import OrganizerPagination from './components/OrganizerPagination.tsx';
import OrganizerSelect from './components/OrganizerSelect.tsx';
import OrganizerToolbar from './components/OrganizerToolbar.tsx';
import { requireOrganizerSession } from '../lib/organizerAuth.ts';
import { exportDashboardCsv, exportDashboardMonthlyCsv, formatZar } from '../lib/organizerExportData.ts';
import { fetchDashboardStats } from '../lib/dataSource.ts';
import type { MockDashboardStats } from '../lib/mockOrganizer.ts';
import {
  type DashboardPeriod,
  formatDashboardMonthLabel,
  ORGANIZER_EVENTS_PER_PAGE,
  paginate,
  normalizeMonthlySales,
  prepareTicketMixRows,
} from '../lib/organizerListUtils.ts';
import { organizerManageEventsUrl } from '../lib/organizerApi.ts';
import { useMockData } from '../lib/dataSource.ts';
import { useOrganizerEvent } from './OrganizerEventContext.tsx';

type EventStatsRow = {
  eventId: string;
  title: string;
  editionLabel: string;
  date: string;
  status: 'live' | 'draft' | 'ended' | 'archived';
  stats: MockDashboardStats | null;
  loading: boolean;
};

function EventCharts({
  stats,
  editionLabel,
}: {
  stats: MockDashboardStats;
  editionLabel: string;
}) {
  const monthlySorted = normalizeMonthlySales(stats.monthlySales);
  const ticketMix = prepareTicketMixRows(stats.ticketTypeDistribution);
  const hasTicketMix = ticketMix.length > 0;

  return (
    <div className="mt-6 space-y-5 md:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div className="rounded-sm border border-brand-border/70 bg-white/40 p-6 md:p-7">
          <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent mb-6">
            Sales by month · {editionLabel}
          </h3>
          {monthlySorted.length > 0 ? (
            <OrganizerBarChart
              bars={monthlySorted.map((m) => ({
                id: m.month,
                label: formatDashboardMonthLabel(m.month),
                value: m.amount,
              }))}
              formatValue={(n) => formatZar(n)}
            />
          ) : (
            <p className="text-sm text-brand-muted">No sales for this period.</p>
          )}
        </div>

        <div className="rounded-sm border border-brand-border/70 bg-white/40 p-6 md:p-7">
          <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent mb-6">
            By ticket type · {editionLabel}
          </h3>
          {hasTicketMix ? (
            <OrganizerDonutChart
              segments={ticketMix.map((row) => ({
                label: row.label,
                value: row.value,
              }))}
              centerLabel="Tickets"
              size="md"
            />
          ) : (
            <p className="text-sm text-brand-muted">No tickets sold yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrganizerDashboardPage() {
  const session = requireOrganizerSession();
  const { liveEditions, loading: eventsLoading } = useOrganizerEvent();
  const [eventsPage, setEventsPage] = useState(1);
  const [eventStats, setEventStats] = useState<EventStatsRow[]>([]);
  const [period, setPeriod] = useState<DashboardPeriod>('6months');

  const eventsSlice = useMemo(
    () => paginate(liveEditions, eventsPage, ORGANIZER_EVENTS_PER_PAGE),
    [liveEditions, eventsPage],
  );

  useEffect(() => {
    setEventsPage(1);
  }, [liveEditions.length]);

  useEffect(() => {
    const editions = paginate(liveEditions, eventsPage, ORGANIZER_EVENTS_PER_PAGE).items;
    if (editions.length === 0) {
      setEventStats([]);
      return;
    }

    setEventStats(
      editions.map((e) => ({
        eventId: e.id,
        title: e.title,
        editionLabel: e.editionLabel,
        date: e.date,
        status: e.status,
        stats: null,
        loading: true,
      })),
    );

    let cancelled = false;
    Promise.all(
      editions.map(async (edition) => {
        try {
          const stats = await fetchDashboardStats(edition.id, period);
          return { eventId: edition.id, stats, error: false as const };
        } catch {
          return { eventId: edition.id, stats: null, error: true as const };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setEventStats((prev) =>
        prev.map((row) => {
          const hit = results.find((r) => r.eventId === row.eventId);
          if (!hit) return { ...row, loading: false };
          return { ...row, stats: hit.stats, loading: false };
        }),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [liveEditions, eventsPage, period]);

  if (!session) return null;

  return (
    <OrganizerLayout session={session} title="Dashboard">
      <OrganizerToolbar
        filters={
          <OrganizerSelect
            label="Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
            options={[
              { value: '6months', label: 'Last 6 months' },
              { value: 'year', label: 'Last 12 months' },
              { value: 'all', label: 'All time' },
            ]}
          />
        }
      />

      <section className="mb-10 md:mb-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent">
            By event
          </h2>
          <p className="text-[11px] text-brand-muted">
            Stats and charts scoped to each edition
          </p>
        </div>

        <div className="space-y-8 md:space-y-10">
          {eventsLoading ? (
            <p className="text-sm text-brand-muted">Loading events…</p>
          ) : liveEditions.length === 0 ? (
            <div className="organizer-surface rounded-sm p-8 md:p-10 text-center max-w-lg mx-auto">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent">
                No events yet
              </p>
              <p className="mt-4 text-sm font-light text-brand-muted leading-relaxed">
                When an event is published on AmpEx it will appear here with orders, tickets, and
                revenue stats.
              </p>
              {!useMockData ? (
                <a
                  href={organizerManageEventsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent hover:text-brand-text"
                >
                  Manage events on AmpEx →
                </a>
              ) : null}
            </div>
          ) : null}
          {eventStats.map((row) => (
            <div key={row.eventId} className="organizer-surface rounded-sm p-6 md:p-8">
              <OrganizerEventGroupHeader
                title={row.title}
                editionLabel={row.editionLabel}
                date={row.date}
                status={row.status}
                count={row.stats?.ticketsSold ?? 0}
                countLabel="tickets sold"
              />

              {row.loading ? (
                <p className="text-sm text-brand-muted">Loading stats…</p>
              ) : row.stats ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-w-0">
                      {[
                        { label: 'Revenue', value: formatZar(row.stats.revenueTotal) },
                        { label: 'Tickets sold', value: String(row.stats.ticketsSold) },
                        { label: 'Active', value: String(row.stats.ticketsActive) },
                        { label: 'Check-in', value: `${row.stats.checkInRate}%` },
                      ].map((card) => (
                        <div
                          key={card.label}
                          className="rounded-sm border border-brand-border/70 bg-white/40 px-4 py-3"
                        >
                          <p className="text-[9px] uppercase tracking-[0.14em] text-brand-muted">{card.label}</p>
                          <p className="mt-1 font-serif text-xl tabular-nums text-brand-text">{card.value}</p>
                        </div>
                      ))}
                    </div>
                    <OrganizerExportMenu
                      actions={[
                        {
                          id: `summary-${row.eventId}`,
                          label: 'Summary CSV',
                          onClick: () => exportDashboardCsv(row.stats!),
                        },
                        {
                          id: `monthly-${row.eventId}`,
                          label: 'Sales by month CSV',
                          onClick: () => exportDashboardMonthlyCsv(row.stats!),
                        },
                      ]}
                    />
                  </div>

                  <EventCharts stats={row.stats} editionLabel={row.editionLabel} />
                </>
              ) : (
                <p className="text-sm text-brand-muted">Could not load stats for this edition.</p>
              )}
            </div>
          ))}
        </div>

        <OrganizerPagination
          page={eventsSlice.page}
          totalPages={eventsSlice.totalPages}
          totalItems={eventsSlice.total}
          onPageChange={setEventsPage}
          itemLabel="editions"
        />
      </section>
    </OrganizerLayout>
  );
}
