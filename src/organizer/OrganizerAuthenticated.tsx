import type { ReactNode } from 'react';
import { OrganizerEventProvider } from './OrganizerEventContext.tsx';

/** Wraps organizer pages with event context. Auth is enforced by OrganizerSessionGate. */
export default function OrganizerAuthenticated({ children }: { children: ReactNode }) {
  return <OrganizerEventProvider>{children}</OrganizerEventProvider>;
}
