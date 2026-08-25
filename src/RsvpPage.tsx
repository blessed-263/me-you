import { motion } from 'motion/react';
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import Sponsors from './components/Sponsors.tsx';
import { apiUrl } from './lib/api.ts';
import { type RsvpSession } from './lib/rsvpSessions.ts';
import { VENUE_ADDRESS_ONE_LINE } from './lib/venue.ts';

type FormState = {
  fullName: string;
  email: string;
  phone: string;
};

type RsvpPageProps = {
  session: RsvpSession;
};

function StatusCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-14 rounded-sm border border-brand-border bg-brand-surface/50 px-8 py-12 text-center md:px-10 md:py-14">
      <p className="text-[1.75rem] font-semibold leading-tight text-brand-text md:text-[2rem]">
        {title}
      </p>
      <div className="mt-4 text-[15px] font-normal leading-[1.7] text-brand-muted">{children}</div>
    </div>
  );
}

function FullBookedMessage({ session }: { session: RsvpSession }) {
  const showStayTuned = session.id === 'after-party-lunch';

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-[1.85rem] font-semibold leading-tight text-brand-text md:text-[2rem]">
        {session.title} is at capacity
      </p>
      {showStayTuned && (
        <p className="mt-4 max-w-sm text-[15px] font-normal leading-[1.7] text-brand-muted">
          Stay tuned for the next date.
        </p>
      )}
      <a
        href="/rsvp"
        className="mt-8 inline-block bg-brand-text px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-bg transition-colors hover:bg-brand-text/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        RSVP for 30 August
      </a>
      <a
        href="/"
        className="mt-4 inline-block text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent transition-colors hover:text-brand-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        Back to site
      </a>
    </div>
  );
}

export default function RsvpPage({ session }: RsvpPageProps) {
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'duplicate' | 'error'>(
    'idle',
  );
  const [errorMessage, setErrorMessage] = useState('');

  const update =
    (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch(apiUrl('/api/rsvp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          session: session.id,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadySubmitted?: boolean;
      };

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      if (data.alreadySubmitted) {
        setStatus('duplicate');
        return;
      }

      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  }

  const siteHeader = (
    <header className="border-b border-brand-border/80 bg-brand-bg/90 px-6 py-5 md:px-10 md:py-6">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-6">
        <a href="/" className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">
          <img
            src="/sponsors/youandme white.png"
            alt="You & Me Africa"
            className="h-12 w-auto object-contain invert sm:h-14 md:h-[6.5rem]"
          />
        </a>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
          Private RSVP
        </p>
      </div>
    </header>
  );

  if (session.full) {
    return (
      <div className="min-h-screen bg-brand-bg font-sans text-brand-text selection:bg-brand-accent/25 selection:text-brand-text">
        {siteHeader}
        <main className="mx-auto max-w-lg">
          <FullBookedMessage session={session} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text selection:bg-brand-accent/25 selection:text-brand-text">
      {siteHeader}

      <main className="mx-auto max-w-lg px-6 pb-20 pt-14 md:px-8 md:pb-28 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          <header className="space-y-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent">
              {session.time}
            </p>
            <h1 className="text-[2.5rem] font-semibold leading-[1.1] text-brand-text md:text-[3rem]">
              {session.title}
            </h1>
            <div className="space-y-3 text-[15px] leading-[1.65] text-brand-muted">
              <p>
                <span className="font-medium text-brand-text">YOU&amp;ME with Martell</span>
                <span className="text-brand-muted/80"> · </span>
                31 May 2026
              </p>
              <p>{VENUE_ADDRESS_ONE_LINE}</p>
              <p className="text-sm leading-[1.7] md:text-[15px]">{session.description}</p>
            </div>
          </header>

          <div className="border border-brand-border bg-brand-surface/40 px-5 py-5 md:px-6 md:py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
              Your invitation
            </p>
            <p className="mt-2 text-xl font-semibold leading-snug text-brand-text md:text-[1.35rem]">
              {session.title}
            </p>
            <p className="mt-1 text-sm font-medium text-brand-accent md:text-[15px]">{session.time}</p>
          </div>

          {status === 'success' ? (
            <StatusCard title="You're on the list.">
              <p>
                Confirmed for{' '}
                <strong className="font-medium text-brand-text">{session.title}</strong> ({session.time}
                ). A confirmation has been sent to your email.
              </p>
              <a
                href="/"
                className="mt-8 inline-block text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent transition-colors hover:text-brand-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              >
                Back to site
              </a>
            </StatusCard>
          ) : status === 'duplicate' ? (
            <StatusCard title="Already registered.">
              <p>This email already has an RSVP. Each guest may register once only.</p>
            </StatusCard>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-7 border-t border-brand-border/60 pt-10">
              <fieldset className="space-y-7" disabled={status === 'submitting'}>
                <legend className="sr-only">RSVP details</legend>

                <label className="block">
                  <span className="rsvp-label">Full name *</span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={update('fullName')}
                    className="rsvp-field"
                  />
                </label>

                <label className="block">
                  <span className="rsvp-label">Email *</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={update('email')}
                    className="rsvp-field"
                  />
                </label>

                <label className="block">
                  <span className="rsvp-label">Phone</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="Optional"
                    value={form.phone}
                    onChange={update('phone')}
                    className="rsvp-field"
                  />
                </label>
              </fieldset>

              {status === 'error' && errorMessage && (
                <p
                  className="rounded-sm border border-red-900/15 bg-red-50/50 px-4 py-3 text-sm leading-relaxed text-red-900/85"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-brand-text px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-bg transition-[background-color,opacity,transform] duration-200 hover:bg-brand-text/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {status === 'submitting' ? 'Sending…' : `Confirm RSVP — ${session.title}`}
              </button>
            </form>
          )}

          <Sponsors compact className="!mt-16 !pt-12" />
        </motion.div>
      </main>
    </div>
  );
}
