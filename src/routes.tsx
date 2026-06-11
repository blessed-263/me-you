import { Navigate, Route, Routes } from 'react-router-dom';
import App from './App.tsx';
import JuneRsvpPage from './JuneRsvpPage.tsx';
import OrganizerPage from './OrganizerPage.tsx';
import RsvpPage from './RsvpPage.tsx';
import SignInPage from './SignInPage.tsx';
import TicketPage from './TicketPage.tsx';
import ProjectAnalytics from './components/ProjectAnalytics.tsx';
import SeoHead from './components/SeoHead.tsx';
import { RSVP_SESSIONS } from './lib/rsvpSessions.ts';

export default function AppRoutes() {
  return (
    <>
      <SeoHead />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<SignInPage />} />
        <Route
          path="/tickets/login"
          element={<Navigate to="/login?return=%2Ftickets%2Fpick" replace />}
        />
        <Route
          path="/organizer/login"
          element={<Navigate to="/login?return=%2Forganizer%2Fdashboard" replace />}
        />
        <Route path="/june" element={<JuneRsvpPage />} />
        <Route path="/september" element={<JuneRsvpPage />} />
        <Route
          path="/harvest-table"
          element={<RsvpPage session={RSVP_SESSIONS['harvest-table']} />}
        />
        <Route
          path="/after-party-lunch"
          element={<RsvpPage session={RSVP_SESSIONS['after-party-lunch']} />}
        />
        <Route
          path="/the-after-party"
          element={<Navigate to="/after-party-lunch" replace />}
        />
        <Route path="/tickets/*" element={<TicketPage />} />
        <Route path="/event/*" element={<TicketPage />} />
        <Route path="/organizer" element={<Navigate to="/organizer/dashboard" replace />} />
        <Route path="/organizer/*" element={<OrganizerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ProjectAnalytics />
    </>
  );
}
