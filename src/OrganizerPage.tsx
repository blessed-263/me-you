/**
 * Organizer dashboard routes (nested under /organizer/*).
 * @license SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import OrganizerSessionGate from './components/OrganizerSessionGate.tsx';
import { loadOrganizerSession } from './lib/organizerAuth.ts';
import { ORGANIZER_ROUTES } from './lib/mockOrganizer.ts';
import { signInUrl } from './lib/signInAuth.ts';
import OrganizerAuthenticated from './organizer/OrganizerAuthenticated.tsx';
import OrganizerDashboardPage from './organizer/OrganizerDashboardPage.tsx';
import OrganizerOrdersPage from './organizer/OrganizerOrdersPage.tsx';
import OrganizerTicketsPage from './organizer/OrganizerTicketsPage.tsx';
import OrganizerAttendeesPage from './organizer/OrganizerAttendeesPage.tsx';
import OrganizerRevenuePage from './organizer/OrganizerRevenuePage.tsx';

function OrganizerShell({ children }: { children: ReactNode }) {
  return <OrganizerAuthenticated>{children}</OrganizerAuthenticated>;
}

export default function OrganizerPage() {
  return (
    <Routes>
      <Route
        index
        element={<Navigate to={ORGANIZER_ROUTES.DASHBOARD} replace />}
      />
      <Route
        path="dashboard"
        element={
          <OrganizerSessionGate>
            <OrganizerShell>
              <OrganizerDashboardPage />
            </OrganizerShell>
          </OrganizerSessionGate>
        }
      />
      <Route
        path="orders"
        element={
          <OrganizerSessionGate>
            <OrganizerShell>
              <OrganizerOrdersPage />
            </OrganizerShell>
          </OrganizerSessionGate>
        }
      />
      <Route
        path="tickets"
        element={
          <OrganizerSessionGate>
            <OrganizerShell>
              <OrganizerTicketsPage />
            </OrganizerShell>
          </OrganizerSessionGate>
        }
      />
      <Route
        path="attendees"
        element={
          <OrganizerSessionGate>
            <OrganizerShell>
              <OrganizerAttendeesPage />
            </OrganizerShell>
          </OrganizerSessionGate>
        }
      />
      <Route
        path="revenue"
        element={
          <OrganizerSessionGate>
            <OrganizerShell>
              <OrganizerRevenuePage />
            </OrganizerShell>
          </OrganizerSessionGate>
        }
      />
      <Route
        path="*"
        element={
          loadOrganizerSession() ? (
            <Navigate to={ORGANIZER_ROUTES.DASHBOARD} replace />
          ) : (
            <Navigate to={signInUrl(ORGANIZER_ROUTES.DASHBOARD)} replace />
          )
        }
      />
    </Routes>
  );
}
