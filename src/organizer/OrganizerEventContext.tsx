import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { EventEdition } from '../lib/eventEditions.ts';
import { fetchOrganizerEditions } from '../lib/dataSource.ts';
import { loadSelectedEventId, saveSelectedEventId } from '../lib/organizerEventScope.ts';

type OrganizerEventContextValue = {
  liveEditions: EventEdition[];
  loading: boolean;
  selectedEventId: string | null;
  selectedEdition: EventEdition | null;
  setSelectedEventId: (eventId: string) => void;
};

const OrganizerEventContext = createContext<OrganizerEventContextValue | null>(null);

export function OrganizerEventProvider({ children }: { children: ReactNode }) {
  const [liveEditions, setLiveEditions] = useState<EventEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedState] = useState<string | null>(() => loadSelectedEventId());

  useEffect(() => {
    fetchOrganizerEditions()
      .then(setLiveEditions)
      .finally(() => setLoading(false));
  }, []);

  const setSelectedEventId = useCallback((eventId: string) => {
    saveSelectedEventId(eventId);
    setSelectedState(eventId);
  }, []);

  const selectedEdition = useMemo(() => {
    const active = liveEditions.filter((e) => e.status === 'live' || e.status === 'draft');
    const pool = active.length > 0 ? active : liveEditions;
    if (selectedEventId) {
      const found = pool.find((e) => e.id === selectedEventId);
      if (found) return found;
    }
    return pool[0] ?? null;
  }, [liveEditions, selectedEventId]);

  useEffect(() => {
    if (selectedEdition && selectedEdition.id !== selectedEventId) {
      saveSelectedEventId(selectedEdition.id);
      setSelectedState(selectedEdition.id);
    }
  }, [selectedEdition, selectedEventId]);

  const value = useMemo(
    (): OrganizerEventContextValue => ({
      liveEditions: liveEditions.filter(
        (e) => e.status === 'live' || e.status === 'draft' || e.status === 'ended',
      ),
      loading,
      selectedEventId: selectedEdition?.id ?? null,
      selectedEdition,
      setSelectedEventId,
    }),
    [liveEditions, loading, selectedEdition, setSelectedEventId],
  );

  return <OrganizerEventContext.Provider value={value}>{children}</OrganizerEventContext.Provider>;
}

export function useOrganizerEvent(): OrganizerEventContextValue {
  const ctx = useContext(OrganizerEventContext);
  if (!ctx) throw new Error('useOrganizerEvent must be used within OrganizerEventProvider');
  return ctx;
}
