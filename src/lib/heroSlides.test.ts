import { describe, expect, it } from 'vitest';
import { HERO_SLIDES } from './heroSlides.ts';

describe('HERO_SLIDES', () => {
  it('contains at least one slide and stable mobile-first slide', () => {
    expect(HERO_SLIDES.length).toBeGreaterThan(0);
    expect(HERO_SLIDES[0]?.mobileOnly).toBe(true);
    expect(HERO_SLIDES[0]?.src).toContain('/images/hero/');
  });
});
