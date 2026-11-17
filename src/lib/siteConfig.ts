/** Site-wide flags and third-party URLs (tickets, analytics). */

function viteEnv(): ImportMetaEnv {
  return import.meta.env ?? ({} as ImportMetaEnv);
}

const env = viteEnv();

export const GA_MEASUREMENT_ID = env.VITE_GA_MEASUREMENT_ID || 'G-94B8TN0YS1';

/** Howler event for tickets (You & Me with Martell, Sunday 6 December 2026). */
export const HOWLER_EVENT_URL = 'https://www.howler.co.za/events/you-me-with-martell-18dc';

/**
 * Every "buy tickets" link on the site. Deliberately ignores VITE_TICKETS_URL so a
 * stale value on Vercel can't send people to an old event; change HOWLER_EVENT_URL instead.
 */
export const EXTERNAL_TICKETS_URL = HOWLER_EVENT_URL;

/** AmpEx / Medusa ticket checkout and organizer dashboard. Off by default — tickets sold on Howler. */
export const isAmpExEnabled = env.VITE_AMPEX_ENABLED === 'true';

export function ticketsHref(): string {
  return isAmpExEnabled ? '/tickets' : EXTERNAL_TICKETS_URL;
}

export function trackOutboundClick(label: string): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'click', {
    event_category: 'outbound',
    event_label: label,
  });
}
