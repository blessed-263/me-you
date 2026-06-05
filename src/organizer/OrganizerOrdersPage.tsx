import { useEffect, useMemo, useState } from 'react';
import OrganizerLayout from './OrganizerLayout.tsx';
import OrganizerExpandableList from './components/OrganizerExpandableList.tsx';
import OrganizerExportMenu from './components/OrganizerExportMenu.tsx';
import OrganizerFilterChips from './components/OrganizerFilterChips.tsx';
import OrganizerSelect from './components/OrganizerSelect.tsx';
import OrganizerToolbar from './components/OrganizerToolbar.tsx';
import { requireOrganizerSession } from '../lib/organizerAuth.ts';
import { exportOrdersCsv, exportOrdersJson } from '../lib/organizerExportData.ts';
import { fetchOrganizerOrders } from '../lib/dataSource.ts';
import type { MockOrganizerOrder, OrganizerOrderStatus } from '../lib/mockOrganizer.ts';
import { formatPrice } from '../lib/mockTickets.ts';
import { useOrganizerEvent } from './OrganizerEventContext.tsx';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_CLASS: Record<OrganizerOrderStatus, string> = {
  completed: 'bg-brand-accent/15 text-brand-accent',
  pending: 'bg-amber-100/80 text-amber-900',
  refunded: 'bg-brand-border text-brand-muted',
};

type StatusFilter = 'all' | OrganizerOrderStatus;
type SortKey = 'newest' | 'oldest' | 'total-high' | 'total-low';

export default function OrganizerOrdersPage() {
  const session = requireOrganizerSession();
  const { selectedEventId } = useOrganizerEvent();
  const [orders, setOrders] = useState<MockOrganizerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedEventId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOrganizerOrders(selectedEventId)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [selectedEventId]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setQuery('');
    setExpandedId(null);
  }, [selectedEventId]);

  const filtered = useMemo(() => {
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
      if (sort === 'newest') return new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime();
      if (sort === 'oldest') return new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime();
      if (sort === 'total-high') return b.total - a.total;
      return a.total - b.total;
    });
    return list;
  }, [orders, query, statusFilter, sort]);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  if (!session || !selectedEventId) return null;

  const defaultExpanded = filtered[0]?.id ?? null;
  const activeExpandedId = expandedId ?? defaultExpanded;

  const listItems = filtered.map((order) => ({
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
        <span className="text-[11px] text-brand-muted w-full sm:w-auto sm:ml-auto">{formatWhen(order.paidAt)}</span>
      </div>
    ),
    details: <OrderDetails order={order} />,
  }));

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

      <OrganizerExpandableList
        items={listItems}
        expandedId={activeExpandedId}
        onToggle={toggle}
        emptyMessage="No orders match your filters."
      />
    </OrganizerLayout>
  );
}

function OrderDetails({ order }: { order: MockOrganizerOrder }) {
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
          <p className="mt-1 text-brand-text">{formatWhen(order.paidAt)}</p>
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
    </div>
  );
}
