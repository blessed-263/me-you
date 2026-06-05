import type { ReactNode } from 'react';
import { ArrowUpRight, LayoutDashboard, LogOut, Receipt, Ticket, Users, Wallet } from 'lucide-react';
import { useMockData } from '../lib/dataSource.ts';
import { formatEditionDate } from '../lib/eventEditions.ts';
import { organizerManageEventsUrl } from '../lib/organizerApi.ts';
import { ORGANIZER_ROUTES } from '../lib/mockOrganizer.ts';
import type { OrganizerSession } from '../lib/organizerAuth.ts';
import { logoutOrganizer } from '../lib/organizerAuth.ts';
import { useOrganizerEvent } from './OrganizerEventContext.tsx';
import OrganizerEventSwitcher, {
  OrganizerEventSwitcherMobile,
  useSelectedPublicTicketsHref,
} from './components/OrganizerEventSwitcher.tsx';

const NAV = [
  { href: ORGANIZER_ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { href: ORGANIZER_ROUTES.ORDERS, label: 'Orders', icon: Receipt },
  { href: ORGANIZER_ROUTES.TICKETS, label: 'Tickets', icon: Ticket },
  { href: ORGANIZER_ROUTES.ATTENDEES, label: 'Attendees', icon: Users },
  { href: ORGANIZER_ROUTES.REVENUE, label: 'Revenue', icon: Wallet },
] as const;

type OrganizerLayoutProps = {
  session: OrganizerSession;
  title: string;
  children: ReactNode;
};

export default function OrganizerLayout({ session, title, children }: OrganizerLayoutProps) {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const { selectedEdition } = useOrganizerEvent();
  const ticketsHref = useSelectedPublicTicketsHref();

  return (
    <div className="organizer-app min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-brand-text">
      <div className="flex min-h-screen">
        <aside className="organizer-sidebar hidden lg:flex lg:flex-col lg:w-[280px] xl:w-[300px] shrink-0">
          <div className="flex flex-col h-full min-h-screen px-6 xl:px-8 py-9 xl:py-11">
            <a href="/" className="shrink-0 group inline-block">
              <img
                src="/sponsors/youandme white.png"
                alt="You & Me Africa"
                className="h-9 w-auto object-contain invert opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </a>

            <div className="mt-10">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-brand-accent flex items-center gap-3">
                <span className="w-10 h-px bg-brand-accent/50" />
                Organizer
              </p>
            </div>

            <div className="mt-8">
              <OrganizerEventSwitcher />
            </div>

            <nav className="mt-10 flex-1 space-y-0.5" aria-label="Organizer navigation">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = path === href;
                return (
                  <a
                    key={href}
                    href={href}
                    className={`organizer-nav-link group flex items-center gap-3 px-3 py-3 transition-all duration-200 ${
                      active ? 'organizer-nav-link--active' : 'hover:bg-black/[0.04]'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center border transition-colors ${
                        active
                          ? 'border-brand-accent/40 bg-brand-bg text-brand-accent shadow-sm'
                          : 'border-brand-border/80 bg-brand-bg/70 text-brand-muted group-hover:text-brand-accent group-hover:bg-brand-bg'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span
                      className={`text-[11px] uppercase tracking-[0.14em] font-semibold ${
                        active ? 'text-brand-text' : 'text-brand-muted group-hover:text-brand-text'
                      }`}
                    >
                      {label}
                    </span>
                  </a>
                );
              })}
            </nav>

            <div className="mt-auto pt-8 border-t border-brand-border/80 space-y-4">
              <a
                href={organizerManageEventsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="organizer-sidebar-cta flex items-center justify-between gap-2 rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent hover:text-brand-text transition-all"
              >
                Manage events on AmpEx
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
              </a>
              <a
                href={ticketsHref}
                className="organizer-sidebar-cta flex items-center justify-between gap-2 rounded-sm px-4 py-3 text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-muted hover:text-brand-text transition-all"
              >
                View ticket page
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
              </a>
              <div className="organizer-user-card rounded-sm px-4 py-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-brand-muted">Signed in</p>
                <p className="mt-1 text-[12px] text-brand-text truncate">{session.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logoutOrganizer();
                  window.location.href = ORGANIZER_ROUTES.LOGIN;
                }}
                className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden />
                Log out
              </button>
            </div>
          </div>
        </aside>

        <div className="organizer-main flex flex-1 flex-col min-w-0 min-h-screen">
          <div className="organizer-preview-strip shrink-0 px-5 py-3 text-center lg:text-left lg:px-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-brand-muted">
              {useMockData ? 'Preview · demo data only' : 'Live · AmpEx data'}
            </p>
            {selectedEdition ? (
              <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-accent">
                {selectedEdition.editionLabel} · {formatEditionDate(selectedEdition.date)}
              </p>
            ) : null}
          </div>

          <header className="lg:hidden shrink-0 border-b border-brand-border bg-brand-bg/95 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <a href="/">
                <img src="/sponsors/youandme white.png" alt="" className="h-8 w-auto invert" />
              </a>
              <button
                type="button"
                onClick={() => {
                  logoutOrganizer();
                  window.location.href = ORGANIZER_ROUTES.LOGIN;
                }}
                className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-muted"
              >
                Log out
              </button>
            </div>
            <OrganizerEventSwitcherMobile />
            <nav className="flex gap-2 overflow-x-auto px-5 pb-4 scrollbar-none" aria-label="Organizer navigation">
              {NAV.map(({ href, label }) => {
                const active = path === href;
                return (
                  <a
                    key={href}
                    href={href}
                    className={`shrink-0 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.12em] font-semibold transition-colors ${
                      active
                        ? 'bg-brand-text text-white shadow-sm'
                        : 'border border-brand-border text-brand-muted bg-white/80'
                    }`}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 px-5 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12 xl:px-14">
            <header className="organizer-page-header mb-10 md:mb-12 pb-8">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent flex items-center gap-3 lg:hidden">
                <span className="w-8 h-px bg-brand-accent/50" />
                Organizer
              </p>
              <h1 className="mt-2 lg:mt-0 font-serif text-4xl md:text-[2.75rem] font-semibold text-brand-text leading-[1.08] tracking-tight">
                {title}
              </h1>
              {selectedEdition ? (
                <p className="mt-3 text-sm font-light text-brand-muted">
                  <span className="organizer-live-badge inline-flex mr-2 align-middle">Live</span>
                  {selectedEdition.title} · {selectedEdition.editionLabel}
                </p>
              ) : null}
            </header>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
