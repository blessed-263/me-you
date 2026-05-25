import { Analytics } from '@vercel/analytics/react';

/** Tracks page views for every route in this SPA (/, /harvest-table, /after-party-lunch, aliases). */
export default function ProjectAnalytics() {
  const pathname =
    typeof window !== 'undefined'
      ? window.location.pathname.replace(/\/$/, '') || '/'
      : '/';

  return <Analytics framework="react" path={pathname} route={pathname} />;
}
