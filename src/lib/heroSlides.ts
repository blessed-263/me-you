/** Homepage hero carousel — run `npm run hero:optimize` after updating sources. */

export type HeroSlide = {
  src: string;
  alt: string;
  /** Portrait / mobile-first slide — hidden from md breakpoint up */
  mobileOnly?: boolean;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    src: '/images/hero/slide-01.jpg',
    alt: 'You & Me Africa gathering at Primedia Rooftop',
    mobileOnly: true,
  },
  {
    src: '/images/hero/slide-02.jpg',
    alt: 'Guests at You & Me Africa cultural event',
  },
  {
    src: '/images/hero/slide-03.jpg',
    alt: 'You & Me Africa community celebration',
  },
  {
    src: '/images/hero/slide-04.jpg',
    alt: 'You & Me Africa second edition moments',
  },
];
