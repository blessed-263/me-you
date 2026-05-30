import { useState, type ChangeEvent, type FormEvent } from 'react';
import { apiUrl } from './lib/api.ts';

type FormState = {
  fullName: string;
  email: string;
  phone: string;
};

export default function JuneRsvpPage() {
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
      const res = await fetch(apiUrl('/api/rsvp/june'), {
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

      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text selection:bg-brand-accent/25 selection:text-brand-text">
      <header className="border-b border-brand-border/80 bg-brand-bg/90 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <a
            href="/"
            className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
          >
            <img
              src="/sponsors/youandme white.png"
              alt="You & Me Africa"
              className="h-10 w-auto object-contain invert sm:h-12"
            />
          </a>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
            RSVP
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 pb-16 pt-12 md:px-8 md:pt-16">
        <div className="space-y-8">
          <header className="space-y-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent">
              September 2026
            </p>
            <h1 className="text-[2rem] font-semibold leading-tight text-brand-text md:text-[2.25rem]">
              RSVP for the next one
            </h1>
            <p className="text-[15px] leading-relaxed text-brand-muted">
              Register your interest. We&apos;ll share date and details soon.
            </p>
          </header>

          {status === 'success' ? (
            <div className="rounded-sm border border-brand-border bg-brand-surface/50 px-6 py-10 text-center">
              <p className="text-xl font-semibold text-brand-text">You&apos;re on the list.</p>
              <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
                Confirmation sent to your email.
              </p>
              <a
                href="/"
                className="mt-6 inline-block text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent hover:text-brand-text"
              >
                Back to site
              </a>
            </div>
          ) : status === 'duplicate' ? (
            <div className="rounded-sm border border-brand-border bg-brand-surface/50 px-6 py-10 text-center">
              <p className="text-xl font-semibold text-brand-text">Already registered.</p>
              <p className="mt-3 text-[15px] text-brand-muted">
                This email already has a September RSVP.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <fieldset className="space-y-5" disabled={status === 'submitting'}>
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
                  className="rounded-sm border border-red-900/15 bg-red-50/50 px-4 py-3 text-sm text-red-900/85"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-brand-text px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-bg transition-opacity hover:bg-brand-text/90 disabled:opacity-55"
              >
                {status === 'submitting' ? 'Sending…' : 'Confirm RSVP'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
