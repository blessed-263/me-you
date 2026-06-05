import { useEffect, useMemo, useState } from 'react';
import OrganizerLayout from './OrganizerLayout.tsx';
import OrganizerExpandableList from './components/OrganizerExpandableList.tsx';
import OrganizerExportMenu from './components/OrganizerExportMenu.tsx';
import OrganizerFilterChips from './components/OrganizerFilterChips.tsx';
import OrganizerSelect from './components/OrganizerSelect.tsx';
import OrganizerToolbar from './components/OrganizerToolbar.tsx';
import { requireOrganizerSession } from '../lib/organizerAuth.ts';
import { exportTicketsCsv, exportTicketsJson } from '../lib/organizerExportData.ts';
import { fetchOrganizerTickets } from '../lib/dataSource.ts';
import type { MockOrganizerTicket } from '../lib/mockOrganizer.ts';
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
  const { selectedEventId } = useOrganizerEvent();
  const [allTickets, setAllTickets] = useState<MockOrganizerTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedEventId) {
      setAllTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOrganizerTickets(selectedEventId)
      .then(setAllTickets)
      .finally(() => setLoading(false));
  }, [selectedEventId]);
  const ticketTypes = useMemo(
    () => ['all', ...Array.from(new Set(allTickets.map((t) => t.ticketType))).sort()],
    [allTickets],
  );
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setExpandedId(null);
  }, [selectedEventId]);

  const filtered = useMemo(() => {
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

  if (!session || !selectedEventId) return null;

  const listItems = filtered.map((t) => ({
    id: t.id,
    data: t,
    summary: (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 w-full text-sm">
        <span className="font-mono text-[11px] text-brand-muted shrink-0">{t.id}</span>
        <span className="text-brand-text font-medium flex-1 min-w-[6rem]">{t.holderName}</span>
        <span className="text-brand-muted text-[12px] hidden sm:inline truncate max-w-[12rem]">{t.ticketType}</span>
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

      <OrganizerExpandableList
        items={listItems}
        expandedId={expandedId}
        onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
        emptyMessage="No tickets match your filters."
      />
    </OrganizerLayout>
  );
}
