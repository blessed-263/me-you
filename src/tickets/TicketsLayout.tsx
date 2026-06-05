import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  attendeeDisplayName,
  loadAttendeeSession,
  logoutAttendee,
  ticketsLoginUrl,
} from '../lib/attendeeAuth.ts';
import { TICKETS_LOGIN, TICKETS_MY } from '../lib/mockCheckout.ts';
import EventAssistant from '../components/EventAssistant.tsx';
import StepIndicator, { type TicketStepId } from './StepIndicator.tsx';

type TicketsLayoutProps = {
  step: TicketStepId;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  showSteps?: boolean;
};

export default function TicketsLayout({
  step,
  backHref = '/tickets',
  backLabel = 'Back',
  children,
  showSteps = true,
}: TicketsLayoutProps) {
  const session = loadAttendeeSession();
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const loginHref = ticketsLoginUrl(path === TICKETS_LOGIN ? '/tickets/pick' : path);

  const handleSignOut = () => {
    logoutAttendee();
    window.location.href = '/tickets';
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-brand-text">
      <motion.header
        initial={false}
        className="sticky top-0 z-[60] bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border shadow-sm"
      >
        <nav className="relative px-5 py-4 md:px-12 md:py-5 flex justify-between items-center gap-4">
          <a href="/" className="shrink-0 flex items-center group">
            <img
              src="/sponsors/youandme white.png"
              alt="You & Me Africa"
              className="h-9 w-auto md:h-10 object-contain invert group-hover:opacity-80 transition-opacity duration-300"
            />
          </a>
          {showSteps && (
            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-full max-w-sm px-24 pointer-events-none">
              <StepIndicator current={step} />
            </div>
          )}
          <div className="flex items-center gap-2 sm:gap-3 z-10">
            {session ? (
              <>
                <a
                  href={TICKETS_MY}
                  className="hidden sm:inline text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-accent hover:text-brand-text transition-colors"
                >
                  My tickets
                </a>
                <span className="hidden lg:inline text-[10px] text-brand-muted truncate max-w-[8rem]">
                  {attendeeDisplayName(session)}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-muted hover:text-brand-text transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <a
                href={loginHref}
                className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-accent hover:text-brand-text transition-colors"
              >
                Sign in
              </a>
            )}
            <a
              href="/organizer/login"
              className="hidden md:inline text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-muted hover:text-brand-accent transition-colors"
            >
              Organizer
            </a>
            <a
              href={backHref}
              className="text-[10px] rounded-full px-4 py-2.5 md:px-6 uppercase tracking-[0.14em] font-semibold border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-muted transition-colors whitespace-nowrap"
            >
              ← {backLabel}
            </a>
          </div>
        </nav>
        {showSteps && (
          <div className="md:hidden px-5 pb-4 border-t border-brand-border/50 pt-3">
            <StepIndicator current={step} />
          </div>
        )}
        {session ? (
          <div className="sm:hidden px-5 pb-3 flex justify-end">
            <a
              href={TICKETS_MY}
              className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-accent"
            >
              My tickets
            </a>
          </div>
        ) : null}
      </motion.header>

      <main>{children}</main>
      <EventAssistant />
    </div>
  );
}
