import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { TICKETS_BASE, TICKETS_MY } from '../lib/mockCheckout.ts';
import SiteNavAuth from '../components/SiteNavAuth.tsx';
import { useAttendeeSession } from '../hooks/useAttendeeSession.ts';
import { useOrganizerSession } from '../hooks/useOrganizerSession.ts';
import StepIndicator, { type TicketStepId } from './StepIndicator.tsx';

type TicketsLayoutProps = {
  step: TicketStepId;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  showSteps?: boolean;
};

const navLinkClass =
  'text-[10px] uppercase tracking-[0.12em] font-semibold transition-colors whitespace-nowrap';

export default function TicketsLayout({
  step,
  backHref,
  backLabel = 'Back',
  children,
  showSteps = true,
}: TicketsLayoutProps) {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, '') || '/';
  const organizerSession = useOrganizerSession();
  const attendeeSession = useAttendeeSession();
  const onEventsPage = path === TICKETS_BASE;
  const showBackLink = Boolean(backHref && backHref !== TICKETS_BASE);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-brand-text">
      <motion.header
        initial={false}
        className="sticky top-0 z-[60] bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border shadow-sm"
      >
        <nav className="px-5 py-4 md:px-12 md:py-5 flex items-center gap-4 md:gap-6">
          <a href="/" className="shrink-0 flex items-center group">
            <img
              src="/sponsors/youandme white.png"
              alt="You & Me Africa"
              className="h-9 w-auto md:h-10 object-contain invert group-hover:opacity-80 transition-opacity duration-300"
            />
          </a>

          {showSteps ? (
            <div className="hidden md:flex flex-1 justify-center min-w-0 px-2">
              <StepIndicator current={step} />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-end gap-4 sm:gap-5 min-w-0">
              {!organizerSession ? (
                <Link
                  to={TICKETS_BASE}
                  className={`${navLinkClass} ${
                    onEventsPage ? 'text-brand-text' : 'text-brand-muted hover:text-brand-text'
                  }`}
                  aria-current={onEventsPage ? 'page' : undefined}
                >
                  Events
                </Link>
              ) : null}
              {!organizerSession && attendeeSession ? (
                <Link
                  to={TICKETS_MY}
                  className={`${navLinkClass} ${
                    path === TICKETS_MY
                      ? 'text-brand-text'
                      : 'text-brand-accent hover:text-brand-text'
                  }`}
                >
                  My tickets
                </Link>
              ) : null}
            </div>
          )}

          <SiteNavAuth
            variant="tickets"
            showMyTicketsInline={showSteps && !organizerSession && Boolean(attendeeSession)}
          />

          {showBackLink ? (
            <a
              href={backHref}
              className={`${navLinkClass} text-brand-muted hover:text-brand-text hidden sm:inline shrink-0`}
            >
              ← {backLabel}
            </a>
          ) : null}
        </nav>

        {showSteps ? (
          <div className="md:hidden px-5 pb-4 border-t border-brand-border/50 pt-3">
            <StepIndicator current={step} />
          </div>
        ) : null}
      </motion.header>

      <main>{children}</main>
    </div>
  );
}
