import { useEffect, useMemo, useState } from 'react';
import OrganizerLayout from './OrganizerLayout.tsx';
import OrganizerExpandableList from './components/OrganizerExpandableList.tsx';
import OrganizerExportMenu from './components/OrganizerExportMenu.tsx';
import OrganizerSelect from './components/OrganizerSelect.tsx';
import OrganizerToolbar from './components/OrganizerToolbar.tsx';
import { requireOrganizerSession } from '../lib/organizerAuth.ts';
import { exportAttendeesCsv, exportAttendeesJson } from '../lib/organizerExportData.ts';
import { fetchOrganizerAttendees } from '../lib/dataSource.ts';
import type { MockAttendee } from '../lib/mockOrganizer.ts';
import { useOrganizerEvent } from './OrganizerEventContext.tsx';

type CheckInFilter = 'all' | 'checked-in' | 'not-checked-in';

export default function OrganizerAttendeesPage() {
  const session = requireOrganizerSession();
  const { selectedEventId } = useOrganizerEvent();
  const [all, setAll] = useState<MockAttendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedEventId) {
      setAll([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOrganizerAttendees(selectedEventId)
      .then(setAll)
      .finally(() => setLoading(false));
  }, [selectedEventId]);
  const ticketTypes = useMemo(
    () => ['all', ...Array.from(new Set(all.map((a) => a.ticketType))).sort()],
    [all],
  );
  const [query, setQuery] = useState('');
  const [checkInFilter, setCheckInFilter] = useState<CheckInFilter>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((a) => {
      if (checkInFilter === 'checked-in' && !a.checkedIn) return false;
      if (checkInFilter === 'not-checked-in' && a.checkedIn) return false;
      if (typeFilter !== 'all' && a.ticketType !== typeFilter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.ticketType.toLowerCase().includes(q) ||
        a.orderReference.toLowerCase().includes(q)
      );
    });
  }, [all, query, checkInFilter, typeFilter]);

  if (!session || !selectedEventId) return null;

  const listItems = filtered.map((a) => ({
    id: a.id,
    data: a,
    summary: (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full text-sm">
        <span className="text-brand-text font-medium flex-1 min-w-[8rem]">{a.name}</span>
        <span className="text-brand-muted truncate max-w-[10rem] hidden md:inline">{a.email}</span>
        <span className="text-brand-muted text-[12px]">{a.ticketType}</span>
        {a.checkedIn ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-accent shrink-0">
            Checked in
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.12em] text-brand-muted shrink-0">Pending</span>
        )}
      </div>
    ),
    details: (
      <dl className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[9px] uppercase tracking-[0.14em] text-brand-muted">Email</dt>
          <dd className="mt-0.5 text-brand-text break-all">{a.email}</dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase tracking-[0.14em] text-brand-muted">Phone</dt>
          <dd className="mt-0.5 text-brand-text">{a.phone || '—'}</dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase tracking-[0.14em] text-brand-muted">Order</dt>
          <dd className="mt-0.5 font-mono text-brand-accent">{a.orderReference}</dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase tracking-[0.14em] text-brand-muted">Check-in</dt>
          <dd className="mt-0.5 text-brand-text">{a.checkedIn ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
    ),
  }));

  return (
    <OrganizerLayout session={session} title="Attendees">
      <OrganizerToolbar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search name, email, ticket type…"
        filters={
          <>
            <OrganizerSelect
              label="Check-in"
              value={checkInFilter}
              onChange={(e) => setCheckInFilter(e.target.value as CheckInFilter)}
              options={[
                { value: 'all', label: 'All attendees' },
                { value: 'checked-in', label: 'Checked in' },
                { value: 'not-checked-in', label: 'Not checked in' },
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
        resultLabel="attendees"
        actions={
          <OrganizerExportMenu
            actions={[
              { id: 'csv', label: 'Export CSV', onClick: () => exportAttendeesCsv(filtered) },
              { id: 'json', label: 'Export JSON', onClick: () => exportAttendeesJson(filtered) },
            ]}
          />
        }
      />

      <OrganizerExpandableList
        items={listItems}
        expandedId={expandedId}
        onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
        emptyMessage="No attendees match your filters."
      />
    </OrganizerLayout>
  );
}
