import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import RsvpPage from './RsvpPage.tsx';
import { RSVP_SESSIONS, sessionFromPath } from './lib/rsvpSessions.ts';
import './index.css';

function Root() {
  const sessionId = sessionFromPath(window.location.pathname);

  if (sessionId) {
    return <RsvpPage session={RSVP_SESSIONS[sessionId]} />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
