import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './routes.tsx';

vi.mock('./lib/siteConfig.ts', () => ({
  isAmpExEnabled: true,
  EXTERNAL_TICKETS_URL: 'https://howler.co.za',
  GA_MEASUREMENT_ID: 'G-TEST',
}));

vi.mock('./App.tsx', () => ({
  default: () => <div data-testid="home-page">Home</div>,
}));

vi.mock('./SignInPage.tsx', () => ({
  default: () => <div data-testid="sign-in-page">Sign in</div>,
}));

vi.mock('./RsvpPage.tsx', () => ({
  default: () => <div data-testid="rsvp-page">RSVP</div>,
}));

vi.mock('./TicketPage.tsx', () => ({
  default: () => <div data-testid="ticket-page">Tickets</div>,
}));

vi.mock('./OrganizerPage.tsx', () => ({
  default: () => <div data-testid="organizer-page">Organizer</div>,
}));

vi.mock('./JuneRsvpPage.tsx', () => ({
  default: () => <div data-testid="june-rsvp-page">June RSVP</div>,
}));

vi.mock('./components/SeoHead.tsx', () => ({
  default: () => null,
}));

vi.mock('./components/ProjectAnalytics.tsx', () => ({
  default: () => null,
}));

vi.mock('./components/GoogleAnalytics.tsx', () => ({
  default: () => null,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('AppRoutes', () => {
  it('renders home at /', () => {
    renderAt('/');
    expect(screen.getByTestId('home-page')).toBeTruthy();
  });

  it('renders sign-in at /login', () => {
    renderAt('/login');
    expect(screen.getByTestId('sign-in-page')).toBeTruthy();
  });

  it('renders RSVP at /harvest-table', () => {
    renderAt('/harvest-table');
    expect(screen.getByTestId('rsvp-page')).toBeTruthy();
  });

  it('renders ticket flow at /tickets/pick', () => {
    renderAt('/tickets/pick');
    expect(screen.getByTestId('ticket-page')).toBeTruthy();
  });

  it('renders organizer at /organizer/dashboard', () => {
    renderAt('/organizer/dashboard');
    expect(screen.getByTestId('organizer-page')).toBeTruthy();
  });
});
