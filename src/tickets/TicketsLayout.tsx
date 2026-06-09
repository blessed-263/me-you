import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  attendeeDisplayName,
  loadAttendeeSession,
  logoutAttendee,
  ticketsLoginUrl,
} from '../lib/attendeeAuth.ts';
import { TICKETS_BASE, TICKETS_MY } from '../lib/mockCheckout.ts';
import { SIGN_IN_PATH } from '../lib/signInAuth.ts';
import EventAssistant from '../components/EventAssistant.tsx';
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
  const session = loadAttendeeSession();
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const loginHref = ticketsLoginUrl(
    path === SIGN_IN_PATH || path === '/tickets/login' ? '/tickets/pick' : path,
  );
  const onEventsPage = path === TICKETS_BASE;

  const handleSignOut = () => {
    logoutAttendee();
    window.location.href = TICKETS_BASE;
  };

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
              <a
                href={TICKETS_BASE}
                className={`${navLinkClass} ${
                  onEventsPage ? 'text-brand-text' : 'text-brand-muted hover:text-brand-text'
                }`}
                aria-current={onEventsPage ? 'page' : undefined}
              >
                Events
              </a>
              {session ? (
                <a
                  href={TICKETS_MY}
                  className={`${navLinkClass} ${
                    path === TICKETS_MY
                      ? 'text-brand-text'
                      : 'text-brand-accent hover:text-brand-text'
                  }`}
                >
                  My tickets
                </a>
              ) : null}
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {session ? (
              <>
                {showSteps ? (
                  <a
                    href={TICKETS_MY}
                    className={`hidden sm:inline ${navLinkClass} text-brand-accent hover:text-brand-text`}
                  >
                    My tickets
                  </a>
                ) : null}
                <span className="hidden lg:inline text-[10px] text-brand-muted truncate max-w-[7rem]">
                  {attendeeDisplayName(session)}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`${navLinkClass} text-brand-muted hover:text-brand-text`}
                >
                  Sign out
                </button>
              </>
            ) : (
              <a
                href={loginHref}
                className={`${navLinkClass} text-brand-accent hover:text-brand-text`}
              >
                Sign in
              </a>
            )}

            {showBackLink ? (
              <a
                href={backHref}
                className={`${navLinkClass} text-brand-muted hover:text-brand-text hidden sm:inline`}
              >
                ← {backLabel}
              </a>
            ) : null}
          </div>
        </nav>

        {showSteps ? (
          <div className="md:hidden px-5 pb-4 border-t border-brand-border/50 pt-3">
            <StepIndicator current={step} />
          </div>
        ) : null}
      </motion.header>

      <main>{children}</main>
      <EventAssistant />
    </div>
  );
}
