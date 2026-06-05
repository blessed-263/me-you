import type { ReactNode } from 'react';
import { requireOrganizerSession } from '../lib/organizerAuth.ts';
import { OrganizerEventProvider, useOrganizerEvent } from './OrganizerEventContext.tsx';
import OrganizerNoLiveEvents from './OrganizerNoLiveEvents.tsx';

function OrganizerLiveGate({ children }: { children: ReactNode }) {
  const session = requireOrganizerSession();
  const { liveEditions, loading } = useOrganizerEvent();

  if (!session) return null;
  if (loading) {
    return (
      <div className="organizer-app min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-sm text-brand-muted">Loading events…</p>
      </div>
    );
  }
  if (liveEditions.length === 0) return <OrganizerNoLiveEvents session={session} />;
  return <>{children}</>;
}

export default function OrganizerAuthenticated({ children }: { children: ReactNode }) {
  const session = requireOrganizerSession();
  if (!session) return null;

  return (
    <OrganizerEventProvider>
      <OrganizerLiveGate>{children}</OrganizerLiveGate>
    </OrganizerEventProvider>
  );
}
