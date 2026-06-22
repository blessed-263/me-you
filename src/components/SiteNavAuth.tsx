import { Link, useNavigate } from 'react-router-dom';
import { attendeeDisplayName, ticketsLoginUrl } from '../lib/attendeeAuth.ts';
import { logoutAllSessions } from '../lib/sessionLogout.ts';
import { ORGANIZER_ROUTES } from '../lib/mockOrganizer.ts';
import { SIGN_IN_PATH } from '../lib/signInAuth.ts';
import { TICKETS_MY } from '../lib/mockCheckout.ts';
import {
  EXTERNAL_TICKETS_URL,
  isAmpExEnabled,
  trackOutboundClick,
} from '../lib/siteConfig.ts';
import { useAttendeeSession } from '../hooks/useAttendeeSession.ts';
import { useOrganizerSession } from '../hooks/useOrganizerSession.ts';

const navLinkClass =
  'text-[10px] uppercase tracking-[0.12em] font-semibold transition-colors whitespace-nowrap';

type SiteNavAuthProps = {
  variant: 'marketing' | 'tickets';
  ticketsPath?: string;
  showMyTicketsInline?: boolean;
  className?: string;
};

export default function SiteNavAuth({
  variant,
  ticketsPath = '/tickets',
  showMyTicketsInline = false,
  className = '',
}: SiteNavAuthProps) {
  const navigate = useNavigate();
  const organizerSession = useOrganizerSession();
  const attendeeSession = useAttendeeSession();

  if (organizerSession) {
    return (
      <div className={`flex items-center gap-3 sm:gap-4 ${className}`}>
        <Link
          to={ORGANIZER_ROUTES.DASHBOARD}
          className={
            variant === 'marketing'
              ? 'text-[10px] rounded-full px-4 py-2.5 md:px-8 md:py-3 uppercase tracking-[0.14em] font-semibold bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors whitespace-nowrap'
              : `${navLinkClass} text-brand-accent hover:text-brand-text`
          }
        >
          Dashboard
        </Link>
        <span className="hidden lg:inline text-[10px] text-brand-muted truncate max-w-[7rem]">
          {organizerSession.name || organizerSession.email}
        </span>
        <button
          type="button"
          onClick={() => {
            void logoutAllSessions().then(() => navigate('/'));
          }}
          className={`${navLinkClass} text-brand-muted hover:text-brand-text`}
        >
          Sign out
        </button>
      </div>
    );
  }

  if (variant === 'marketing') {
    if (!isAmpExEnabled) {
      return (
        <a
          href={EXTERNAL_TICKETS_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackOutboundClick('howler_tickets_nav')}
          className={`text-[10px] rounded-full px-4 py-2.5 md:px-8 md:py-3 uppercase tracking-[0.14em] font-semibold bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors whitespace-nowrap ${className}`}
        >
          Buy Tickets
        </a>
      );
    }

    return (
      <a
        href={ticketsPath}
        className={`text-[10px] rounded-full px-4 py-2.5 md:px-8 md:py-3 uppercase tracking-[0.14em] font-semibold bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors whitespace-nowrap ${className}`}
      >
        Buy Tickets
      </a>
    );
  }

  if (!isAmpExEnabled) {
    return null;
  }

  const loginHref = ticketsLoginUrl(
    window.location.pathname === SIGN_IN_PATH ? '/tickets/pick' : window.location.pathname,
  );

  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${className}`}>
      {attendeeSession && showMyTicketsInline ? (
        <Link
          to={TICKETS_MY}
          className={`hidden sm:inline ${navLinkClass} text-brand-accent hover:text-brand-text`}
        >
          My tickets
        </Link>
      ) : null}
      {attendeeSession ? (
        <>
          <span className="hidden lg:inline text-[10px] text-brand-muted truncate max-w-[7rem]">
            {attendeeDisplayName(attendeeSession)}
          </span>
          <button
            type="button"
            onClick={() => {
              void logoutAllSessions().then(() => navigate(ticketsPath));
            }}
            className={`${navLinkClass} text-brand-muted hover:text-brand-text`}
          >
            Sign out
          </button>
        </>
      ) : (
        <a href={loginHref} className={`${navLinkClass} text-brand-accent hover:text-brand-text`}>
          Sign in
        </a>
      )}
    </div>
  );
}
