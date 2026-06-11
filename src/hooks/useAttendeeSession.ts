import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AUTH_CHANGED_EVENT } from '../lib/authEvents.ts';
import {
  loadAttendeeSession,
  resolveAttendeeSession,
  type AttendeeSession,
} from '../lib/attendeeAuth.ts';

/** Reactive attendee session (sessionStorage + live cookie validation). */
export function useAttendeeSession(): AttendeeSession | null {
  const { pathname } = useLocation();
  const [session, setSession] = useState<AttendeeSession | null>(() => loadAttendeeSession());

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      setSession(loadAttendeeSession());
      void resolveAttendeeSession().then((resolved) => {
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
