import { useEffect, useMemo, useState } from 'react';
import OrganizerLayout from './OrganizerLayout.tsx';
import OrganizerExpandableList from './components/OrganizerExpandableList.tsx';
import OrganizerExportMenu from './components/OrganizerExportMenu.tsx';
import OrganizerEventGroupHeader from './components/OrganizerEventGroupHeader.tsx';
import OrganizerFilterChips from './components/OrganizerFilterChips.tsx';
import OrganizerPagination from './components/OrganizerPagination.tsx';
import OrganizerSelect from './components/OrganizerSelect.tsx';
import OrganizerToolbar from './components/OrganizerToolbar.tsx';
import { requireOrganizerSession } from '../lib/organizerAuth.ts';
import { exportTicketsCsv, exportTicketsJson } from '../lib/organizerExportData.ts';
import { fetchOrganizerTickets } from '../lib/dataSource.ts';
import type { MockOrganizerTicket } from '../lib/mockOrganizer.ts';
import {
  groupRecordsByEvent,
  type EventGrouped,
  ORGANIZER_EVENTS_PER_PAGE,
  ORGANIZER_ITEMS_PER_PAGE,
  paginate,
} from '../lib/organizerListUtils.ts';
import { useOrganizerEvent } from './OrganizerEventContext.tsx';

const STATUS_CLASS = {
  active: 'bg-brand-accent/15 text-brand-accent',
  used: 'bg-brand-surface text-brand-muted',
  cancelled: 'bg-red-100/60 text-red-900/80',
} as const;

type StatusFilter = 'all' | keyof typeof STATUS_CLASS;

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function OrganizerTicketsPage() {
  const session = requireOrganizerSession();
  const { liveEditions } = useOrganizerEvent();
  const [allTickets, setAllTickets] = useState<MockOrganizerTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [eventsPage, setEventsPage] = useState(1);
  const [itemPages, setItemPages] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchOrganizerTickets()
      .then(setAllTickets)
      .finally(() => setLoading(false));
  }, []);

  const ticketTypes = useMemo(
    () => ['all', ...Array.from(new Set(allTickets.map((t) => t.ticketType))).sort()],
    [allTickets],
  );

  const filtered = useMemo((): MockOrganizerTicket[] => {
    const q = query.trim().toLowerCase();
    return allTickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (typeFilter !== 'all' && t.ticketType !== typeFilter) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.holderName.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.ticketType.toLowerCase().includes(q)
      );
    });
  }, [allTickets, query, statusFilter, typeFilter]);

  const groups = useMemo(
    (): EventGrouped<MockOrganizerTicket>[] =>
      groupRecordsByEvent<MockOrganizerTicket>(filtered, liveEditions),
    [filtered, liveEditions],
  );

  const eventsSlice = useMemo(
    () => paginate<EventGrouped<MockOrganizerTicket>>(groups, eventsPage, ORGANIZER_EVENTS_PER_PAGE),
    [groups, eventsPage],
  );

  useEffect(() => {
    setEventsPage(1);
    setItemPages({});
    setExpandedId(null);
  }, [query, statusFilter, typeFilter]);

  const getItemPage = (eventId: string) => itemPages[eventId] ?? 1;
  const setItemPage = (eventId: string, page: number) => {
    setItemPages((prev) => ({ ...prev, [eventId]: page }));
  };

  if (!session) return null;

  return (
    <OrganizerLayout session={session} title="Tickets">
      <OrganizerToolbar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search holder, ID, reference…"
        filters={
          <>
            <OrganizerFilterChips
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'used', label: 'Used' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <OrganizerSelect
              label="Ticket type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={ticketTypes.map((t) => ({
                value: t,
                label: t === 'all' ? 'All types' : t,
              }))}
            />
          </>
        }
        resultCount={filtered.length}
        resultLabel="tickets"
        actions={
          <OrganizerExportMenu
            actions={[
              { id: 'csv', label: 'Export CSV', onClick: () => exportTicketsCsv(filtered) },
              { id: 'json', label: 'Export JSON', onClick: () => exportTicketsJson(filtered) },
            ]}
          />
        }
      />

      {loading ? (
        <p className="text-sm text-brand-muted">Loading tickets…</p>
      ) : groups.length === 0 ? (
        <div className="organizer-surface rounded-sm p-10 text-center text-sm text-brand-muted">
          No tickets match your filters.
        </div>
      ) : (
        <div className="space-y-8">
          {eventsSlice.items.map((group) => {
            const itemSlice = paginate<MockOrganizerTicket>(
              group.items,
              getItemPage(group.eventId),
              ORGANIZER_ITEMS_PER_PAGE,
            );
            const listItems = itemSlice.items.map((t) => ({
              id: t.id,
              data: t,
              summary: (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 w-full text-sm">
                  <span className="font-mono text-[11px] text-brand-muted shrink-0">{t.id}</span>
                  <span className="text-brand-text font-medium flex-1 min-w-[6rem]">{t.holderName}</span>
                  <span className="text-brand-muted text-[12px] hidden sm:inline truncate max-w-[12rem]">
                    {t.ticketType}
                  </span>
                  <span
                    className={`text-[9px] uppercase tracking-[0.12em] font-semibold px-2 py-1 rounded-full shrink-0 ${STATUS_CLASS[t.status]}`}
                  >
                    {t.status}
                  </span>
                </div>
              ),
              details: (
                <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.14em] text-brand-muted">Ticket type</dt>
                    <dd className="mt-0.5 text-brand-text">{t.ticketType}</dd>
                  </div>
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.14em] text-brand-muted">Order reference</dt>
                    <dd className="mt-0.5 font-mono text-brand-accent">{t.reference}</dd>
                  </div>
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.14em] text-brand-muted">Issued</dt>
                    <dd className="mt-0.5 text-brand-text">{formatWhen(t.issuedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.14em] text-brand-muted">Order ID</dt>
                    <dd className="mt-0.5 font-mono text-[11px] text-brand-muted">{t.orderId}</dd>
                  </div>
                </dl>
              ),
            }));

            return (
              <section key={group.eventId} className="organizer-surface rounded-sm p-6 md:p-7">
                <OrganizerEventGroupHeader
                  title={group.title}
                  editionLabel={group.editionLabel}
                  date={group.date}
                  status={group.status}
                  count={group.items.length}
                  countLabel="tickets"
                />
                <OrganizerExpandableList
                  items={listItems}
                  expandedId={expandedId}
                  onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
                  emptyMessage="No tickets for this edition."
                />
                {group.items.length > ORGANIZER_ITEMS_PER_PAGE ? (
                  <OrganizerPagination
                    page={itemSlice.page}
                    totalPages={itemSlice.totalPages}
                    totalItems={itemSlice.total}
                    onPageChange={(page) => setItemPage(group.eventId, page)}
                    itemLabel="tickets"
                  />
                ) : null}
              </section>
            );
          })}

          <OrganizerPagination
            page={eventsSlice.page}
            totalPages={eventsSlice.totalPages}
            totalItems={eventsSlice.total}
            onPageChange={setEventsPage}
            itemLabel="editions"
          />
        </div>
      )}
    </OrganizerLayout>
  );
}
