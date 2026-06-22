import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GA_MEASUREMENT_ID } from '../lib/siteConfig.ts';

/** Sends GA4 page_view on each client-side route change. */
export default function GoogleAnalytics() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: pathname + search,
    });
  }, [pathname, search]);

  return null;
}
