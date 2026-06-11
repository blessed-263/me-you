import { Analytics } from '@vercel/analytics/react';
import { useLocation } from 'react-router-dom';

/** Tracks page views for every route in this SPA (/, /harvest-table, /after-party-lunch, aliases). */
export default function ProjectAnalytics() {
  const { pathname: rawPath } = useLocation();
  const pathname = rawPath.replace(/\/$/, '') || '/';

  return <Analytics framework="react" path={pathname} route={pathname} />;
}
