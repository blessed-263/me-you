import { useEffect, useMemo, useState } from 'react';
import OrganizerLayout from './OrganizerLayout.tsx';
import OrganizerExpandableList from './components/OrganizerExpandableList.tsx';
import OrganizerExportMenu from './components/OrganizerExportMenu.tsx';
import OrganizerEventGroupHeader from './components/OrganizerEventGroupHeader.tsx';
import OrganizerPagination from './components/OrganizerPagination.tsx';
import OrganizerSelect from './components/OrganizerSelect.tsx';
import OrganizerToolbar from './components/OrganizerToolbar.tsx';
import { requireOrganizerSession } from '../lib/organizerAuth.ts';
import { exportAttendeesCsv, exportAttendeesJson } from '../lib/organizerExportData.ts';
import { fetchOrganizerAttendees } from '../lib/dataSource.ts';
import type { MockAttendee } from '../lib/mockOrganizer.ts';
import {
  groupRecordsByEvent,
  type EventGrouped,
  ORGANIZER_EVENTS_PER_PAGE,
  ORGANIZER_ITEMS_PER_PAGE,
  paginate,
} from '../lib/organizerListUtils.ts';
import { useOrganizerEvent } from './OrganizerEventContext.tsx';

type CheckInFilter = 'all' | 'checked-in' | 'not-checked-in';

export default function OrganizerAttendeesPage() {
  const session = requireOrganizerSession();
  const { liveEditions } = useOrganizerEvent();
  const [all, setAll] = useState<MockAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [checkInFilter, setCheckInFilter] = useState<CheckInFilter>('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [eventsPage, setEventsPage] = useState(1);
  const [itemPages, setItemPages] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchOrganizerAttendees()
      .then(setAll)
      .finally(() => setLoading(false));
  }, []);

  const attendeesForEvent = useMemo((): MockAttendee[] => {
    if (eventFilter === 'all') return all;
    return all.filter((a) => a.eventId === eventFilter);
  }, [all, eventFilter]);

  const ticketTypes = useMemo(() => {
    if (eventFilter === 'all') return ['all'];
    return [
      'all',
      ...Array.from(new Set(attendeesForEvent.map((a) => a.ticketType))).sort(),
    ];
  }, [attendeesForEvent, eventFilter]);

  const filtered = useMemo((): MockAttendee[] => {
    const q = query.trim().toLowerCase();
    return attendeesForEvent.filter((a) => {
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
  }, [attendeesForEvent, query, checkInFilter, typeFilter]);

  const groups = useMemo(
    (): EventGrouped<MockAttendee>[] => groupRecordsByEvent<MockAttendee>(filtered, liveEditions),
    [filtered, liveEditions],
  );

  const eventsSlice = useMemo(
    () => paginate<EventGrouped<MockAttendee>>(groups, eventsPage, ORGANIZER_EVENTS_PER_PAGE),
    [groups, eventsPage],
  );

  useEffect(() => {
    setEventsPage(1);
    setItemPages({});
    setExpandedId(null);
  }, [query, checkInFilter, eventFilter, typeFilter]);

  useEffect(() => {
    setTypeFilter('all');
  }, [eventFilter]);

  const getItemPage = (eventId: string) => itemPages[eventId] ?? 1;
  const setItemPage = (eventId: string, page: number) => {
    setItemPages((prev) => ({ ...prev, [eventId]: page }));
  };

  if (!session) return null;

  return (
    <OrganizerLayout session={session} title="Attendees">
      <OrganizerToolbar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search name, email, ticket type…"
        filters={
          <>
            <OrganizerSelect
              label="Event"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All editions' },
                ...liveEditions.map((edition) => ({
                  value: edition.id,
                  label: `${edition.title} · ${edition.editionLabel}`,
                })),
              ]}
            />
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
              disabled={eventFilter === 'all'}
              options={
                eventFilter === 'all'
                  ? [{ value: 'all', label: 'Select an event first' }]
                  : ticketTypes.map((t) => ({
                      value: t,
                      label: t === 'all' ? 'All types' : t,
                    }))
              }
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

      {loading ? (
        <p className="text-sm text-brand-muted">Loading attendees…</p>
      ) : groups.length === 0 ? (
        <div className="organizer-surface rounded-sm p-10 text-center text-sm text-brand-muted">
          No attendees match your filters.
        </div>
      ) : (
        <div className="space-y-8">
          {eventsSlice.items.map((group) => {
            const itemSlice = paginate<MockAttendee>(
              group.items,
              getItemPage(group.eventId),
              ORGANIZER_ITEMS_PER_PAGE,
            );
            const listItems = itemSlice.items.map((a) => ({
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
                    <span className="text-[10px] uppercase tracking-[0.12em] text-brand-muted shrink-0">
                      Pending
                    </span>
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
              <section key={group.eventId} className="organizer-surface rounded-sm p-6 md:p-7">
                <OrganizerEventGroupHeader
                  title={group.title}
                  editionLabel={group.editionLabel}
                  date={group.date}
                  status={group.status}
                  count={group.items.length}
                  countLabel="attendees"
                />
                <OrganizerExpandableList
                  items={listItems}
                  expandedId={expandedId}
                  onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
                  emptyMessage="No attendees for this edition."
                />
                {group.items.length > ORGANIZER_ITEMS_PER_PAGE ? (
                  <OrganizerPagination
                    page={itemSlice.page}
                    totalPages={itemSlice.totalPages}
                    totalItems={itemSlice.total}
                    onPageChange={(page) => setItemPage(group.eventId, page)}
                    itemLabel="attendees"
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
