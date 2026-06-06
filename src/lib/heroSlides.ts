/** Responsive hero carousel assets — run `npm run hero:optimize` to regenerate. */

export type HeroSlide = {
  id: string;
  alt: string;
  /** Default JPEG (1920px) for noscript / fallback */
  jpegSrc: string;
  jpegSrcSet: string;
  webpSrcSet: string;
};

const WIDTHS = [640, 1280, 1920, 2560] as const;

function buildSlide(id: string, alt: string): HeroSlide {
  const base = `/images/hero/slide-${id}`;
  const jpegSrcSet = WIDTHS.map((w) => `${base}-${w}.jpg ${w}w`).join(', ');
  const webpSrcSet = WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
  return {
    id,
    alt,
    jpegSrc: `${base}-2560.jpg`,
    jpegSrcSet,
    webpSrcSet,
  };
}

export const HERO_SLIDES: HeroSlide[] = [
  buildSlide('01', 'Guests in conversation at You & Me Africa'),
  buildSlide('02', 'You & Me Africa gathering moment'),
  buildSlide('03', 'You & Me Africa cultural event'),
  buildSlide('04', 'You & Me Africa community celebration'),
  buildSlide('05', 'You & Me Africa second edition'),
];

export const HERO_IMAGE_SIZES = '100vw';

/** Pick best URL to prefetch upcoming slide (next width down from 1920) */
export function heroPrefetchUrl(slide: HeroSlide): string {
  return slide.jpegSrc.replace('-2560.jpg', '-1920.webp');
}
