import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { resolveAttendeeSession, ticketsLoginUrl } from '../lib/attendeeAuth.ts';

type GateState = 'loading' | 'authed' | 'guest';

export default function AttendeeSessionGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<GateState>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    resolveAttendeeSession().then((session) => {
      if (!cancelled) {
        setState(session ? 'authed' : 'guest');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (state === 'loading') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center bg-brand-bg">
        <p className="text-sm text-brand-muted">Loading…</p>
      </div>
    );
  }

  if (state === 'guest') {
    return <Navigate to={ticketsLoginUrl(location.pathname)} replace />;
  }

  return children;
}
