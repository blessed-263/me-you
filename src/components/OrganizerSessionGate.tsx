import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ORGANIZER_ROUTES } from '../lib/mockOrganizer.ts';
import { resolveOrganizerSession } from '../lib/organizerAuth.ts';
import { signInUrl } from '../lib/signInAuth.ts';

type GateState = 'loading' | 'authed' | 'guest';

export default function OrganizerSessionGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    resolveOrganizerSession().then((session) => {
      if (!cancelled) {
        setState(session ? 'authed' : 'guest');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="organizer-app min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-sm text-brand-muted">Loading…</p>
      </div>
    );
  }

  if (state === 'guest') {
    return <Navigate to={signInUrl(ORGANIZER_ROUTES.DASHBOARD)} replace />;
  }

  return children;
}
