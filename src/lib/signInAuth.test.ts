import { describe, expect, it, vi, beforeEach } from 'vitest';

import { redirectAfterSignIn } from './signInAuth.ts';

describe('redirectAfterSignIn', () => {
  beforeEach(() => {
    const location = {
      href: 'http://localhost/login?return=%2Forganizer%2Forders',
      pathname: '/login',
      search: '?return=%2Forganizer%2Forders',
    };
    Object.defineProperty(window, 'location', {
      value: location,
      writable: true,
      configurable: true,
    });
  });

  it('uses organizer return target when organizer logs in', () => {
    redirectAfterSignIn('organizer');
    expect(window.location.href).toBe('/organizer/orders');
  });

  it('defaults attendee redirects to tickets flow', () => {
    window.location.search = '';
    redirectAfterSignIn('attendee');
    expect(window.location.href).toBe('/tickets/pick');
  });
});
