import { describe, expect, it } from 'vitest';
import { getRouteSeo } from './seo.ts';

describe('getRouteSeo', () => {
  it('marks checkout and my tickets pages as noindex', () => {
    expect(getRouteSeo('/tickets/checkout').robots).toBe('noindex,nofollow');
    expect(getRouteSeo('/tickets/my-tickets').robots).toBe('noindex,nofollow');
    expect(getRouteSeo('/tickets').robots).toBe('index,follow');
  });
});
