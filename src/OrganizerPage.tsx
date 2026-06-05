/**
 * Routes organizer dashboard by pathname.
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { loadOrganizerSession } from './lib/organizerAuth.ts';
import { ORGANIZER_ROUTES } from './lib/mockOrganizer.ts';
import { signInUrl } from './lib/signInAuth.ts';
import OrganizerAuthenticated from './organizer/OrganizerAuthenticated.tsx';
import OrganizerDashboardPage from './organizer/OrganizerDashboardPage.tsx';
import OrganizerOrdersPage from './organizer/OrganizerOrdersPage.tsx';
import OrganizerTicketsPage from './organizer/OrganizerTicketsPage.tsx';
import OrganizerAttendeesPage from './organizer/OrganizerAttendeesPage.tsx';
import OrganizerRevenuePage from './organizer/OrganizerRevenuePage.tsx';

export default function OrganizerPage() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  if (path === '/organizer') {
    window.location.replace(ORGANIZER_ROUTES.DASHBOARD);
    return null;
  }

  const authed = (
    <OrganizerAuthenticated>
      {path === ORGANIZER_ROUTES.DASHBOARD && <OrganizerDashboardPage />}
      {path === ORGANIZER_ROUTES.ORDERS && <OrganizerOrdersPage />}
      {path === ORGANIZER_ROUTES.TICKETS && <OrganizerTicketsPage />}
      {path === ORGANIZER_ROUTES.ATTENDEES && <OrganizerAttendeesPage />}
      {path === ORGANIZER_ROUTES.REVENUE && <OrganizerRevenuePage />}
    </OrganizerAuthenticated>
  );

  if (
    path === ORGANIZER_ROUTES.DASHBOARD ||
    path === ORGANIZER_ROUTES.ORDERS ||
    path === ORGANIZER_ROUTES.TICKETS ||
    path === ORGANIZER_ROUTES.ATTENDEES ||
    path === ORGANIZER_ROUTES.REVENUE
  ) {
    return authed;
  }

  if (loadOrganizerSession()) {
    window.location.replace(ORGANIZER_ROUTES.DASHBOARD);
  } else {
    window.location.replace(signInUrl(ORGANIZER_ROUTES.DASHBOARD));
  }
  return null;
}
