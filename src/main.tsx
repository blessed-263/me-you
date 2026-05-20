import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import RsvpPage from './RsvpPage.tsx';
import './index.css';

const isRsvpPage = /^\/rsvp\/?$/.test(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isRsvpPage ? <RsvpPage /> : <App />}
  </StrictMode>,
);
