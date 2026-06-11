import { useEffect, useState } from 'react';
import {
  loadOrganizerSession,
  type OrganizerSession,
} from '../lib/organizerAuth.ts';

/** Reactive read of organizer sessionStorage (updates on window focus). */
export function useOrganizerSession(): OrganizerSession | null {
  const [session, setSession] = useState<OrganizerSession | null>(() =>
    loadOrganizerSession(),
  );

  useEffect(() => {
    const refresh = () => setSession(loadOrganizerSession());
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  return session;
}
