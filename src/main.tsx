import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import JuneRsvpPage from './JuneRsvpPage.tsx';
import RsvpPage from './RsvpPage.tsx';
import ProjectAnalytics from './components/ProjectAnalytics.tsx';
import { RSVP_SESSIONS, sessionFromPath } from './lib/rsvpSessions.ts';
import './index.css';

function Root() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const sessionId = sessionFromPath(pathname);
  const isJuneRsvp = pathname === '/june';

  return (
    <>
      {isJuneRsvp ? (
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
