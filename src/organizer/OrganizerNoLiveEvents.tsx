import { organizerManageEventsUrl } from '../lib/organizerApi.ts';
import { useMockData } from '../lib/dataSource.ts';
import { ORGANIZER_ROUTES } from '../lib/mockOrganizer.ts';
import type { OrganizerSession } from '../lib/organizerAuth.ts';
import { logoutOrganizer } from '../lib/organizerAuth.ts';

type OrganizerNoLiveEventsProps = {
  session: OrganizerSession;
};

export default function OrganizerNoLiveEvents({ session }: OrganizerNoLiveEventsProps) {
  return (
    <div className="organizer-app min-h-screen bg-brand-bg text-brand-text font-sans flex flex-col">
      <header className="border-b border-brand-border px-6 py-5 flex items-center justify-between">
        <a href="/">
          <img src="/sponsors/youandme white.png" alt="You & Me Africa" className="h-9 w-auto invert" />
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
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="organizer-surface max-w-md w-full rounded-sm p-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent">Organizer</p>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-brand-text">No live events</h1>
          <p className="mt-4 text-sm font-light text-brand-muted leading-relaxed">
            There are no editions marked live right now. When an event goes live, orders, tickets, and revenue
            for that edition will appear here.
          </p>
          <p className="mt-6 text-[11px] text-brand-muted">Signed in as {session.email}</p>
          {!useMockData ? (
            <a
              href={organizerManageEventsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent hover:text-brand-text"
            >
              Create events on AmpEx →
            </a>
          ) : null}
          <a
            href="/"
            className="mt-4 inline-block text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-muted hover:text-brand-text"
          >
            ← Back to site
          </a>
        </div>
      </main>
    </div>
  );
}
