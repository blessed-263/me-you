import { RSVP_SESSIONS } from './rsvpSessions.ts';
import { EXTERNAL_TICKETS_URL, isAmpExEnabled } from './siteConfig.ts';
import {
  VENUE_ADDRESS_LINE,
  VENUE_AREA,
  VENUE_MAPS_URL,
  VENUE_NAME,
  VENUE_STREET,
} from './venue.ts';

const DEFAULT_SITE_URL = 'https://www.youandmeafrica.com';

export const SITE_NAME = 'You & Me Africa';
export const SITE_TAGLINE =
  'A cultural gathering in Sandton centered around music, food, conversation and community.';
export const SITE_DESCRIPTION =
  'You & Me Africa is a curated cultural gathering in Sandton, Johannesburg — The Harvest Table experience and The After Lunch Gathering at Primedia Rooftop, 15 Fredman Drive.';
export const SITE_KEYWORDS =
  'You and Me Africa, cultural event Sandton, Johannesburg events, Harvest Table, After Lunch Party, Primedia Rooftop, Sandton tickets, music food community';
export const SITE_LOCALITY = 'Sandton';
export const SITE_REGION = 'Gauteng';
export const SITE_COUNTRY = 'ZA';
export const INSTAGRAM_URL = 'https://www.instagram.com/youandmeafrica/';
export const DEFAULT_OG_IMAGE = '/images/hero/slide-01.jpg';

export function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export type RouteSeo = {
  title: string;
  description: string;
  path: string;
  robots?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function organizationJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: siteUrl,
    logo: absoluteUrl('/sponsors/youandme brown .png'),
    sameAs: [INSTAGRAM_URL],
    description: SITE_DESCRIPTION,
  };
}

function websiteJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    publisher: { '@id': `${siteUrl}/#organization` },
    inLanguage: 'en-ZA',
  };
}

function eventJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${siteUrl}/#event`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    startDate: '2026-05-31T11:00:00+02:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [absoluteUrl(DEFAULT_OG_IMAGE)],
    organizer: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: siteUrl,
      sameAs: [INSTAGRAM_URL],
    },
    location: {
      '@type': 'Place',
      name: VENUE_NAME,
      address: {
        '@type': 'PostalAddress',
        streetAddress: VENUE_STREET,
        addressLocality: SITE_LOCALITY,
        addressRegion: SITE_REGION,
        addressCountry: SITE_COUNTRY,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -26.1076,
        longitude: 28.0567,
      },
      hasMap: VENUE_MAPS_URL,
    },
    offers: {
      '@type': 'Offer',
      url: isAmpExEnabled ? absoluteUrl('/tickets') : EXTERNAL_TICKETS_URL,
      availability: 'https://schema.org/InStock',
      priceCurrency: 'ZAR',
    },
  };
}

function homeJsonLd(siteUrl: string) {
  return [organizationJsonLd(siteUrl), websiteJsonLd(siteUrl), eventJsonLd(siteUrl)];
}

function ticketsJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteUrl}/tickets#webpage`,
    name: 'Buy Tickets — You & Me Africa',
    description: isAmpExEnabled
      ? 'Purchase tickets for You & Me Africa in Sandton — The Harvest Table and The After Lunch Gathering at Primedia Rooftop.'
      : 'Get tickets for You & Me Africa on Howler — curated food, music, and community in Sandton.',
    url: absoluteUrl('/tickets'),
    isPartOf: { '@id': `${siteUrl}/#website` },
    about: { '@id': `${siteUrl}/#event` },
    ...(isAmpExEnabled
      ? {}
      : {
          potentialAction: {
            '@type': 'BuyAction',
            target: EXTERNAL_TICKETS_URL,
          },
        }),
  };
}

function rsvpJsonLd(siteUrl: string, sessionId: keyof typeof RSVP_SESSIONS) {
  const session = RSVP_SESSIONS[sessionId];
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${session.title} — ${SITE_NAME}`,
    description: `${session.description} ${VENUE_ADDRESS_LINE}.`,
    url: absoluteUrl(session.path),
    isPartOf: { '@id': `${siteUrl}/#website` },
  };
}

export function normalizePathname(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/';
}

export function getRouteSeo(pathname: string): RouteSeo {
  const path = normalizePathname(pathname);
  const siteUrl = getSiteUrl();

  if (path === '/') {
    return {
      title: `${SITE_NAME} | Cultural Gathering in Sandton, Johannesburg`,
      description: SITE_DESCRIPTION,
      path: '/',
      ogType: 'website',
      jsonLd: homeJsonLd(siteUrl),
    };
  }

  if (path === '/tickets' || path.startsWith('/tickets/') || path.startsWith('/event/')) {
    const isPrivate = isAmpExEnabled &&
      (path.includes('/payment/') ||
      path === '/tickets/pick' ||
      path === '/tickets/checkout' ||
      path === '/tickets/success' ||
      path === '/tickets/my-tickets' ||
      path.startsWith('/tickets/my-tickets/'));
    return {
      title: `Buy Tickets | ${SITE_NAME} — Sandton`,
      description: isAmpExEnabled
        ? 'Get tickets for You & Me Africa in Sandton — curated food, music, and community at Primedia Rooftop, 15 Fredman Drive.'
        : 'Get tickets for You & Me Africa on Howler — curated food, music, and community in Sandton.',
      path: path.startsWith('/event/') ? path : '/tickets',
      robots: isPrivate ? 'noindex,nofollow' : 'index,follow',
      ogType: 'website',
      jsonLd: ticketsJsonLd(siteUrl),
    };
  }

  if (path === '/harvest-table') {
    const session = RSVP_SESSIONS['harvest-table'];
    return {
      title: `${session.title} | ${SITE_NAME} — Sandton`,
      description: `${session.description} ${VENUE_AREA}. Long-table lunch curated by Nela's Kitchen at Primedia Rooftop, Sandton.`,
      path,
      jsonLd: rsvpJsonLd(siteUrl, 'harvest-table'),
    };
  }

  if (path === '/after-party-lunch' || path === '/the-after-party') {
    const session = RSVP_SESSIONS['after-party-lunch'];
    return {
      title: `${session.title} | ${SITE_NAME} — Sandton`,
      description: `${session.description} ${VENUE_AREA}. Music and community at Primedia Rooftop, Sandton.`,
      path: '/after-party-lunch',
      jsonLd: rsvpJsonLd(siteUrl, 'after-party-lunch'),
    };
  }

  if (
    path === '/login' ||
    path === '/tickets/login' ||
    path === '/organizer/login' ||
    path === '/organizer' ||
    path.startsWith('/organizer/')
  ) {
    return {
      title: `Sign In | ${SITE_NAME}`,
      description: SITE_DESCRIPTION,
      path,
      robots: 'noindex,nofollow',
    };
  }

  if (path === '/june' || path === '/september') {
    return {
      title: `${SITE_NAME} | Upcoming Gathering — Sandton`,
      description: SITE_DESCRIPTION,
      path,
    };
  }

  return {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    path,
  };
}

/** Paths included in sitemap.xml (public, indexable). */
export const SITEMAP_PATHS = [
  '/',
  '/tickets',
  '/harvest-table',
  '/after-party-lunch',
] as const;
