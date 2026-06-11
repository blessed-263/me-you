import { Link } from 'react-router-dom';
import { ORGANIZER_ROUTES } from '../lib/mockOrganizer.ts';
import { useOrganizerSession } from '../hooks/useOrganizerSession.ts';

const defaultClass =
  'text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-accent hover:text-brand-text transition-colors whitespace-nowrap';

type OrganizerDashboardLinkProps = {
  className?: string;
};

export default function OrganizerDashboardLink({
  className = defaultClass,
}: OrganizerDashboardLinkProps) {
  const session = useOrganizerSession();
  if (!session) return null;

  return (
    <Link to={ORGANIZER_ROUTES.DASHBOARD} className={className}>
      Organizer dashboard
    </Link>
  );
}
