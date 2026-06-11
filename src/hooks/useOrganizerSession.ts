import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AUTH_CHANGED_EVENT } from '../lib/authEvents.ts';
import {
  loadOrganizerSession,
  resolveOrganizerSession,
  type OrganizerSession,
} from '../lib/organizerAuth.ts';

/** Reactive organizer session (sessionStorage + live cookie validation). */
export function useOrganizerSession(): OrganizerSession | null {
  const { pathname } = useLocation();
  const [session, setSession] = useState<OrganizerSession | null>(() => loadOrganizerSession());

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      setSession(loadOrganizerSession());
      void resolveOrganizerSession().then((resolved) => {
        if (!cancelled) setSession(resolved);
      });
    };

    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener(AUTH_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refresh);
      window.removeEventListener(AUTH_CHANGED_EVENT, refresh);
    };
  }, [pathname]);

  return session;
}
