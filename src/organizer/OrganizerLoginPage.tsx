import { useState, type FormEvent } from 'react';
import { loginOrganizerAsync } from '../lib/organizerAuth.ts';
import { useMockData } from '../lib/dataSource.ts';
import { ORGANIZER_ROUTES } from '../lib/mockOrganizer.ts';

export default function OrganizerLoginPage() {
  const [email, setEmail] = useState('organizer@youandmeafrica.com');
  const [password, setPassword] = useState('demo');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    setSubmitting(true);
    try {
      await loginOrganizerAsync(email, password);
      window.location.href = ORGANIZER_ROUTES.DASHBOARD;
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === 'PENDING_APPROVAL') {
        setError('Your organizer account is pending approval.');
      } else if (e.code === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email before signing in.');
      } else {
        setError(e.message || 'Sign in failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="organizer-app min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-brand-text flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] shrink-0 border-r border-brand-border flex-col justify-between p-12 xl:p-14">
        <a href="/">
          <img
            src="/sponsors/youandme white.png"
            alt="You & Me Africa"
            className="h-10 w-auto object-contain invert"
          />
        </a>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-brand-accent flex items-center gap-3">
            <span className="w-10 h-px bg-brand-accent/50" />
            Organizer
          </p>
          <p className="mt-6 font-serif text-4xl font-semibold text-brand-text leading-tight text-balance">
            Manage your gathering
          </p>
          <p className="mt-4 text-sm font-light text-brand-muted leading-relaxed max-w-sm">
            Orders, tickets, attendees, and revenue for your published events.
          </p>
        </div>
        <p className="text-[9px] uppercase tracking-[0.16em] text-brand-muted">
          {useMockData ? 'Preview · demo data' : 'AmpEx connected'}
        </p>
      </div>

      <div className="flex-1 flex flex-col min-h-screen organizer-main">
        <header className="lg:hidden px-5 py-5 border-b border-brand-border bg-brand-bg/95 backdrop-blur-sm">
          <a href="/">
            <img src="/sponsors/youandme white.png" alt="" className="h-9 w-auto invert" />
          </a>
        </header>

        <div className="flex-1 flex items-center justify-center px-5 py-16">
          <div className="w-full max-w-md organizer-surface rounded-sm p-8 md:p-10">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent flex items-center gap-3 lg:hidden">
              <span className="w-8 h-px bg-brand-accent/50" />
              Organizer
            </p>
            <h1 className="mt-3 lg:mt-0 font-serif text-3xl md:text-4xl font-semibold text-brand-text">Sign in</h1>
            <p className="mt-2 text-sm font-light text-brand-muted leading-relaxed">
              {useMockData ? 'Demo login — any email and password work.' : 'Sign in with your AmpEx organizer account.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="org-email" className="rsvp-label">Email</label>
                <input
                  id="org-email"
                  type="email"
                  className="rsvp-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="org-password" className="rsvp-label">Password</label>
                <input
                  id="org-password"
                  type="password"
                  className="rsvp-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-sm text-red-700/90" role="alert">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full py-4 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 disabled:opacity-70 transition-colors shadow-sm"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-8 text-center">
              <a
                href="/tickets"
                className="text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent hover:text-brand-text"
              >
                ← Back to tickets
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
