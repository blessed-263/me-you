import { motion } from 'motion/react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import RsvpSponsors from './components/RsvpSponsors.tsx';
import { apiUrl } from './lib/api.ts';
import type { RsvpSession } from './lib/rsvpSessions.ts';

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  dietaryNotes: string;
};

type RsvpPageProps = {
  session: RsvpSession;
};

export default function RsvpPage({ session }: RsvpPageProps) {
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    dietaryNotes: '',
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
          dietaryNotes: form.dietaryNotes || undefined,
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

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
      <header className="border-b border-brand-border bg-brand-bg px-5 py-5 md:px-12">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <a href="/" className="shrink-0">
            <img
              src="https://gallery.youandmeafrica.com/site-icon/you-me.jpeg"
              alt="You & Me Africa"
              className="h-10 w-10 rounded-full border border-brand-text/30 object-cover p-[2px] md:h-12 md:w-12"
            />
          </a>
          <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">
            Private RSVP
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-accent">
            {session.time}
          </p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl font-semibold text-brand-text leading-tight">
            {session.title}
          </h1>
          <p className="mt-4 text-brand-muted text-sm md:text-base leading-relaxed">
            <span className="font-medium text-brand-text">YOU&amp;ME with Martel</span> · 31 May 2026
            <br />
            Primedia Rooftop, Freeman Drive, Sandton
          </p>
          <p className="mt-4 text-sm text-brand-muted leading-relaxed">{session.description}</p>

          <div className="mt-6 border border-brand-border bg-brand-surface/50 px-4 py-3 text-sm text-brand-text">
            <span className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted block mb-1">
              This invitation
            </span>
            {session.title} · {session.time}
            <span className="block mt-2 text-xs text-brand-muted">
              One guest per RSVP. Use only the link you were sent.
            </span>
          </div>

          {status === 'success' ? (
            <div className="mt-12 border border-brand-border bg-brand-surface/60 px-6 py-10 text-center">
              <p className="font-serif text-2xl font-semibold text-brand-text">You&apos;re on the list.</p>
              <p className="mt-3 text-sm text-brand-muted">
                Confirmed for <strong className="text-brand-text">{session.title}</strong> ({session.time}).
                A confirmation has been sent to your email.
              </p>
              <a
                href="/"
                className="mt-8 inline-block text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent hover:text-brand-text transition-colors"
              >
                Back to site
              </a>
            </div>
          ) : status === 'duplicate' ? (
            <div className="mt-12 border border-brand-border bg-brand-surface/60 px-6 py-10 text-center">
              <p className="font-serif text-2xl font-semibold text-brand-text">Already registered.</p>
              <p className="mt-3 text-sm text-brand-muted">
                This email already has an RSVP. Each guest may register once only.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-12 space-y-8">
              <p className="text-xs text-brand-muted -mt-4">
                RSVP is for <strong className="text-brand-text">one person</strong> only (no plus-ones).
              </p>

              <label className="block">
                <span className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">
                  Full name *
                </span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={update('fullName')}
                  className="mt-2 w-full border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-accent transition-colors"
                />
              </label>

              <label className="block">
                <span className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">
                  Email *
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={update('email')}
                  className="mt-2 w-full border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-accent transition-colors"
                />
              </label>

              <label className="block">
                <span className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">
                  Phone
                </span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  className="mt-2 w-full border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-accent transition-colors"
                />
              </label>

              <label className="block">
                <span className="text-[9px] uppercase tracking-[0.16em] font-semibold text-brand-muted">
                  Dietary requirements
                </span>
                <textarea
                  rows={3}
                  value={form.dietaryNotes}
                  onChange={update('dietaryNotes')}
                  className="mt-2 w-full resize-y border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-accent transition-colors"
                />
              </label>

              {status === 'error' && errorMessage && (
                <p className="text-sm text-red-800/90" role="alert">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-brand-text px-8 py-4 text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-bg transition-colors hover:bg-brand-text/90 disabled:opacity-60"
              >
                {status === 'submitting' ? 'Sending…' : `Confirm RSVP — ${session.title}`}
              </button>
            </form>
          )}

          <RsvpSponsors />
        </motion.div>
      </main>
    </div>
  );
}
