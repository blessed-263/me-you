import { motion } from 'motion/react';
import { ArrowUpRight, Calendar, Clock, MapPin } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import SiteNavAuth from './components/SiteNavAuth.tsx';
import Sponsors from './components/Sponsors.tsx';
import { apiUrl } from './lib/api.ts';
import { CURRENT_EDITION } from './lib/currentEdition.ts';
import { VENUE_AREA, VENUE_MAPS_URL, VENUE_NAME, VENUE_STREET } from './lib/venue.ts';

const TICKETS_URL = '/tickets';

type FormState = {
  fullName: string;
  email: string;
  phone: string;
};

function trackRsvpSubmit(): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'rsvp_submit', {
    event_category: 'rsvp',
    event_label: 'third-edition',
  });
}

export default function ThirdEditionRsvpPage() {
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
    (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch(apiUrl('/api/rsvp/third'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
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

      trackRsvpSubmit();
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-brand-text">
      <header className="fixed inset-x-0 top-0 z-[60] w-full max-w-full bg-brand-bg border-b border-brand-border shadow-sm">
        <nav className="relative px-5 py-4 md:px-12 md:py-5 flex justify-between items-center gap-4">
          <a href="/" className="shrink-0 flex items-center group">
            <img
              src="/sponsors/youandme white.png"
              alt="You & Me Africa"
              className="h-9 w-auto md:h-10 object-contain invert group-hover:opacity-80 transition-opacity duration-300"
            />
          </a>
          <SiteNavAuth variant="marketing" ticketsPath={TICKETS_URL} />
        </nav>
      </header>

      <section className="scroll-mt-24 pt-28 pb-10 md:pt-32 md:pb-14 px-6 relative bg-brand-bg">
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent mb-6">
              Third edition · {CURRENT_EDITION.dateShort}
            </p>
            <h1 className="font-serif text-5xl md:text-7xl font-semibold text-brand-text leading-tight">
              RSVP
            </h1>
          </motion.div>
        </div>
      </section>

      <main className="px-6 md:px-12 pb-8 md:pb-12">
        <div className="max-w-xl mx-auto">
          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-brand-border bg-brand-surface/50 px-8 py-14 md:px-12 md:py-16 text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent mb-6">
                Confirmed
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-semibold text-brand-text leading-tight">
                You&apos;re on the list.
              </h2>
              <p className="mt-5 text-[15px] font-light leading-[1.7] text-brand-muted max-w-md mx-auto">
                A confirmation has been sent to your email.
              </p>
              <a
                href="/"
                className="mt-10 inline-block text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent hover:text-brand-text transition-colors"
              >
                Back to site
              </a>
            </motion.div>
          ) : status === 'duplicate' ? (
            <div className="border border-brand-border bg-brand-surface/50 px-8 py-14 md:px-12 md:py-16 text-center">
              <h2 className="font-serif text-4xl md:text-5xl font-semibold text-brand-text leading-tight">
                Already registered.
              </h2>
              <p className="mt-5 text-[15px] font-light leading-[1.7] text-brand-muted max-w-md mx-auto">
                This email already has an RSVP for the third edition. Each guest may register once only.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <fieldset disabled={status === 'submitting'} className="space-y-7">
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
                className="w-full rounded-full bg-brand-text px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-bg transition-[background-color,opacity,transform] duration-200 hover:bg-brand-text/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {status === 'submitting' ? 'Sending…' : 'Confirm RSVP'}
              </button>
            </form>
          )}
        </div>
      </main>

      <section className="scroll-mt-24 py-20 md:py-24 px-6 mt-8 relative">
        <div className="absolute inset-0 bg-brand-surface border-y border-brand-border -z-10" />
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 md:gap-8 justify-between">
            <div className="flex flex-col gap-6 items-center text-center px-4">
              <Calendar className="w-5 h-5 text-brand-accent mb-4 stroke-1" />
              <h5 className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">The Date</h5>
              <p className="font-serif text-3xl lg:text-4xl font-medium text-brand-text">
                {CURRENT_EDITION.dateShort}{' '}
                <span className="italic text-brand-muted">2026</span>
              </p>
            </div>
            <div className="flex flex-col gap-6 items-center text-center px-4">
              <Clock className="w-5 h-5 text-brand-accent mb-4 stroke-1" />
              <h5 className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">The Time</h5>
              <p className="font-serif text-3xl lg:text-4xl font-medium text-brand-text">
                11:00 AM <span className="italic text-brand-muted">to Late</span>
              </p>
            </div>
            <div className="flex flex-col gap-6 items-center text-center px-4">
              <MapPin className="w-5 h-5 text-brand-accent mb-4 stroke-1" />
              <h5 className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">The Setting</h5>
              <p className="font-serif text-3xl lg:text-4xl font-medium text-brand-text text-balance break-words">
                {VENUE_NAME},{' '}
                <span className="italic text-brand-muted">
                  {VENUE_STREET}, {VENUE_AREA}
                </span>
              </p>
              <a
                href={VENUE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent hover:text-brand-text transition-colors"
              >
                Get Directions
                <ArrowUpRight className="w-3 h-3 stroke-[1.5] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-brand-border/50 py-16 px-6 md:px-12 flex flex-col items-center gap-8 md:gap-10 bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/sponsors/youandme white.png"
            alt="You & Me Africa"
            className="h-36 w-auto sm:h-44 md:h-52 lg:h-60 object-contain invert"
          />
        </div>

        <Sponsors className="max-w-5xl mx-auto mt-2 md:mt-4 pt-8 md:pt-10" />

        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-8 pt-6 mt-6 border-t border-brand-border/30">
          <div className="text-[9px] uppercase tracking-[0.3em] text-brand-muted/60">
            © {new Date().getFullYear()} You & Me Africa. All Rights Reserved.
          </div>
          <a
            href="https://www.instagram.com/youandmeafrica/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] uppercase tracking-[0.3em] text-brand-muted hover:text-brand-text transition-colors"
          >
            Instagram
          </a>
        </div>
      </footer>
    </div>
  );
}
