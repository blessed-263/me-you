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
import { exportOrdersCsv, exportOrdersJson } from '../lib/organizerExportData.ts';
import { fetchOrganizerOrders, markOrganizerOrderComplete } from '../lib/dataSource.ts';
import type { MockOrganizerOrder, OrganizerOrderStatus } from '../lib/mockOrganizer.ts';
import {
  groupRecordsByEvent,
  type EventGrouped,
  ORGANIZER_EVENTS_PER_PAGE,
  ORGANIZER_ITEMS_PER_PAGE,
  paginate,
} from '../lib/organizerListUtils.ts';
import { formatOrganizerDateTime, organizerDateMs } from '../lib/organizerDates.ts';
import { formatPrice } from '../lib/mockTickets.ts';
import { useOrganizerEvent } from './OrganizerEventContext.tsx';

const STATUS_CLASS: Record<OrganizerOrderStatus, string> = {
  completed: 'bg-brand-accent/15 text-brand-accent',
  pending: 'bg-amber-100/80 text-amber-900',
  refunded: 'bg-brand-border text-brand-muted',
};

type StatusFilter = 'all' | OrganizerOrderStatus;
type SortKey = 'newest' | 'oldest' | 'total-high' | 'total-low';

export default function OrganizerOrdersPage() {
  const session = requireOrganizerSession();
  const { liveEditions } = useOrganizerEvent();
  const [orders, setOrders] = useState<MockOrganizerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [eventsPage, setEventsPage] = useState(1);
  const [itemPages, setItemPages] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleMarkComplete = async (orderId: string) => {
    setActionError(null);
    setCompletingId(orderId);
    try {
      const status = await markOrganizerOrderComplete(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not mark order complete');
    } finally {
      setCompletingId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrganizerOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo((): MockOrganizerOrder[] => {
    const q = query.trim().toLowerCase();
    let list = orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.reference.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        o.buyerEmail.toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === 'newest') return organizerDateMs(b.paidAt) - organizerDateMs(a.paidAt);
      if (sort === 'oldest') return organizerDateMs(a.paidAt) - organizerDateMs(b.paidAt);
      if (sort === 'total-high') return b.total - a.total;
      return a.total - b.total;
    });
    return list;
  }, [orders, query, statusFilter, sort]);

  const groups = useMemo(
    (): EventGrouped<MockOrganizerOrder>[] =>
      groupRecordsByEvent<MockOrganizerOrder>(filtered, liveEditions),
    [filtered, liveEditions],
  );

  const eventsSlice = useMemo(
    () => paginate<EventGrouped<MockOrganizerOrder>>(groups, eventsPage, ORGANIZER_EVENTS_PER_PAGE),
    [groups, eventsPage],
  );

  useEffect(() => {
    setEventsPage(1);
    setItemPages({});
    setExpandedId(null);
  }, [query, statusFilter, sort]);

  const getItemPage = (eventId: string) => itemPages[eventId] ?? 1;
  const setItemPage = (eventId: string, page: number) => {
    setItemPages((prev) => ({ ...prev, [eventId]: page }));
  };

  if (!session) return null;

  return (
    <OrganizerLayout session={session} title="Orders">
      <OrganizerToolbar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search reference, buyer, email…"
        filters={
          <>
            <OrganizerFilterChips
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'refunded', label: 'Refunded' },
              ]}
            />
            <OrganizerSelect
              label="Sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'total-high', label: 'Highest total' },
                { value: 'total-low', label: 'Lowest total' },
              ]}
            />
          </>
        }
        resultCount={filtered.length}
        resultLabel="orders"
        actions={
          <OrganizerExportMenu
            actions={[
              { id: 'csv', label: 'Export CSV', onClick: () => exportOrdersCsv(filtered) },
              { id: 'json', label: 'Export JSON', onClick: () => exportOrdersJson(filtered) },
            ]}
          />
        }
      />

      {actionError ? (
        <p className="mb-4 text-sm text-red-800/90 bg-red-50 border border-red-200/80 rounded-sm px-4 py-3">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-brand-muted">Loading orders…</p>
      ) : groups.length === 0 ? (
        <div className="organizer-surface rounded-sm p-10 text-center text-sm text-brand-muted">
          No orders match your filters.
        </div>
      ) : (
        <div className="space-y-8">
          {eventsSlice.items.map((group) => {
            const itemSlice = paginate<MockOrganizerOrder>(
              group.items,
              getItemPage(group.eventId),
              ORGANIZER_ITEMS_PER_PAGE,
            );
            const listItems = itemSlice.items.map((order) => ({
              id: order.id,
              data: order,
              summary: (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full text-sm">
                  <span className="font-mono text-[11px] text-brand-accent shrink-0">{order.reference}</span>
                  <span className="text-brand-text font-medium flex-1 min-w-[8rem]">{order.buyerName}</span>
                  <span className="tabular-nums shrink-0">R {formatPrice(order.total)}</span>
                  <span
                    className={`text-[9px] uppercase tracking-[0.12em] font-semibold px-2 py-1 rounded-full shrink-0 ${STATUS_CLASS[order.status]}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-[11px] text-brand-muted w-full sm:w-auto sm:ml-auto">
                    {formatOrganizerDateTime(order.paidAt)}
                  </span>
                </div>
              ),
              details: (
                <OrderDetails
                  order={order}
                  onMarkComplete={order.status === 'pending' ? handleMarkComplete : undefined}
                  markingComplete={completingId === order.id}
                />
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
                  countLabel="orders"
                />
                <OrganizerExpandableList
                  items={listItems}
                  expandedId={expandedId}
                  onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
                  emptyMessage="No orders for this edition."
                />
                {group.items.length > ORGANIZER_ITEMS_PER_PAGE ? (
                  <OrganizerPagination
                    page={itemSlice.page}
                    totalPages={itemSlice.totalPages}
                    totalItems={itemSlice.total}
                    onPageChange={(page) => setItemPage(group.eventId, page)}
                    itemLabel="orders"
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

function OrderDetails({
  order,
  onMarkComplete,
  markingComplete,
}: {
  order: MockOrganizerOrder;
  onMarkComplete?: (orderId: string) => void;
  markingComplete?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] font-semibold text-brand-muted">Buyer</p>
          <p className="mt-1 text-brand-text font-medium">{order.buyerName}</p>
          <p className="text-brand-muted">{order.buyerEmail}</p>
          <p className="text-brand-muted">{order.buyerPhone}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] font-semibold text-brand-muted">Paid</p>
          <p className="mt-1 text-brand-text">{formatOrganizerDateTime(order.paidAt)}</p>
        </div>
      </div>
      <div className="border-t border-brand-border/70 pt-4 space-y-2">
        <p className="text-[9px] uppercase tracking-[0.14em] font-semibold text-brand-muted">Line items</p>
        {order.items.map((item) => (
          <div key={item.ticketId} className="flex justify-between gap-3">
            <span>
              {item.ticketName} × {item.quantity}
            </span>
            <span className="tabular-nums shrink-0">R {formatPrice(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>
      <ul className="text-[13px] text-brand-muted space-y-1 border-t border-brand-border/70 pt-4">
        {order.holderNames.map((name, i) => (
          <li key={i}>
            Guest {i + 1}: <span className="text-brand-text">{name}</span>
          </li>
        ))}
      </ul>
      <p className="font-serif text-2xl tabular-nums border-t border-brand-border/70 pt-4">
        R {formatPrice(order.total)}
      </p>
      {onMarkComplete ? (
        <div className="border-t border-brand-border/70 pt-4">
          <button
            type="button"
            onClick={() => onMarkComplete(order.id)}
            disabled={markingComplete}
            className="inline-flex items-center justify-center rounded-sm bg-brand-accent px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {markingComplete ? 'Marking complete…' : 'Mark as complete'}
          </button>
          <p className="mt-2 text-[11px] text-brand-muted">
            Use this when payment was received but the order still shows as pending.
          </p>
        </div>
      ) : null}
    </div>
  );
}
