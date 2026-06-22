/** Site-wide flags and third-party URLs (tickets, analytics). */

function viteEnv(): ImportMetaEnv {
  return import.meta.env ?? ({} as ImportMetaEnv);
}

const env = viteEnv();

export const GA_MEASUREMENT_ID = env.VITE_GA_MEASUREMENT_ID || 'G-94B8TN0YS1';

export const EXTERNAL_TICKETS_URL =
  env.VITE_TICKETS_URL?.replace(/\/$/, '') || 'https://howler.co.za';

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
