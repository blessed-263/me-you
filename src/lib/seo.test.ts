import { describe, expect, it, vi } from 'vitest';

vi.mock('./siteConfig.ts', () => ({
  isAmpExEnabled: true,
  EXTERNAL_TICKETS_URL: 'https://howler.co.za',
}));

import { getRouteSeo } from './seo.ts';

describe('getRouteSeo', () => {
  it('marks checkout and my tickets pages as noindex when AmpEx is enabled', () => {
    expect(getRouteSeo('/tickets/checkout').robots).toBe('noindex,nofollow');
    expect(getRouteSeo('/tickets/my-tickets').robots).toBe('noindex,nofollow');
    expect(getRouteSeo('/tickets').robots).toBe('index,follow');
  });
});
