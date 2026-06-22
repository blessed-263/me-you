/** Site-wide flags and third-party URLs (tickets, analytics). */

export const GA_MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || 'G-94B8TN0YS1';

export const EXTERNAL_TICKETS_URL =
  (import.meta.env.VITE_TICKETS_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://howler.co.za';

/** AmpEx / Medusa ticket checkout and organizer dashboard. Off by default — tickets sold on Howler. */
export const isAmpExEnabled =
  (import.meta.env.VITE_AMPEX_ENABLED as string | undefined) === 'true';

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
