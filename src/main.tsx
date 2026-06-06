import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import JuneRsvpPage from './JuneRsvpPage.tsx';
import RsvpPage from './RsvpPage.tsx';
import SignInPage from './SignInPage.tsx';
import TicketPage from './TicketPage.tsx';
import OrganizerPage from './OrganizerPage.tsx';
import ProjectAnalytics from './components/ProjectAnalytics.tsx';
import SeoHead from './components/SeoHead.tsx';
import { RSVP_SESSIONS, sessionFromPath } from './lib/rsvpSessions.ts';
import './index.css';

function Root() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const sessionId = sessionFromPath(pathname);
  const isSignIn =
    pathname === '/login' ||
    pathname === '/tickets/login' ||
    pathname === '/organizer/login';
  const isFutureRsvp = pathname === '/september' || pathname === '/june';
  const isTickets =
    pathname === '/tickets' ||
    pathname.startsWith('/tickets/') ||
    pathname.startsWith('/event/');
  const isOrganizer = pathname === '/organizer' || pathname.startsWith('/organizer/');

  return (
    <>
      <SeoHead pathname={pathname} />
      {isSignIn ? (
        <SignInPage />
      ) : isOrganizer ? (
        <OrganizerPage />
      ) : isTickets ? (
        <TicketPage />
      ) : isFutureRsvp ? (
        <JuneRsvpPage />
      ) : sessionId ? (
        <RsvpPage session={RSVP_SESSIONS[sessionId]} />
      ) : (
        <App />
      )}
      <ProjectAnalytics />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
