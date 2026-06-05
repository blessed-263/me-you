import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import AmpexWordmark from './components/AmpexWordmark.tsx';
import PasswordInput from './components/PasswordInput.tsx';
import {
  loadAttendeeSession,
  registerAttendeeAsync,
} from './lib/attendeeAuth.ts';
import { loadOrganizerSession } from './lib/organizerAuth.ts';
import { useMockData } from './lib/dataSource.ts';
import { resendVerification } from './lib/storeApi.ts';
import {
  redirectAfterSignIn,
  resolveSignInReturnTo,
  universalSignInAsync,
} from './lib/signInAuth.ts';

type Mode = 'signin' | 'register';

function redirectIfAlreadySignedIn(): boolean {
  const returnTo = resolveSignInReturnTo();
  if (returnTo.startsWith('/organizer') && loadOrganizerSession()) {
    window.location.replace(returnTo);
    return true;
  }
  if (returnTo.startsWith('/tickets') && loadAttendeeSession()) {
    window.location.replace(returnTo);
    return true;
  }
  return false;
}

export default function SignInPage() {
  if (redirectIfAlreadySignedIn()) return null;

  const [mode, setMode] = useState<Mode>('signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleResend = async () => {
    if (!pendingVerifyEmail) return;
    setError('');
    setInfo('');
    try {
      await resendVerification(pendingVerifyEmail);
      setInfo('Verification email sent. Check your inbox.');
    } catch (e) {
      setError((e as Error).message || 'Could not resend verification email.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      if (mode === 'register') {
        if (!firstName.trim() || !lastName.trim()) {
          setError('Enter your first and last name.');
          return;
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          setError('Enter a valid email address.');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          return;
        }
        const result = await registerAttendeeAsync({
          email,
          password,
          firstName,
          lastName,
          phone,
        });
        if (result.verificationRequired) {
          setPendingVerifyEmail(result.email);
          setInfo('Account created. Check your email to verify before signing in.');
          setMode('signin');
          return;
        }
        const role = await universalSignInAsync(email, password);
        redirectAfterSignIn(role);
        return;
      }

      if (!email.trim() || !password.trim()) {
        setError('Enter your email and password.');
        return;
      }

      const role = await universalSignInAsync(email, password);
      redirectAfterSignIn(role);
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setPendingVerifyEmail(email.trim().toLowerCase());
        setError('Please verify your email before signing in.');
      } else if (err.code === 'PENDING_APPROVAL') {
        setError('Your account is pending approval.');
      } else {
        setError(err.message || 'Sign in failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const backHref = '/tickets';

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
          <p className="font-serif text-4xl font-semibold text-brand-text leading-tight text-balance">
            Welcome
          </p>
          <p className="mt-4 text-sm font-light text-brand-muted leading-relaxed max-w-sm">
            Sign in to access tickets, orders, and your event tools.
          </p>
        </div>
        <div>
          {useMockData ? (
            <p className="text-[9px] uppercase tracking-[0.16em] text-brand-muted">Preview · demo data</p>
          ) : (
            <AmpexWordmark size="sm" />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen organizer-main">
        <header className="lg:hidden px-5 py-5 border-b border-brand-border bg-brand-bg/95 backdrop-blur-sm">
          <a href="/">
            <img src="/sponsors/youandme white.png" alt="" className="h-9 w-auto invert" />
          </a>
        </header>

        <div className="flex-1 flex items-center justify-center px-5 py-16">
          <div className="w-full max-w-md organizer-surface rounded-sm p-8 md:p-10">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-brand-text">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h1>
            <p className="mt-2 text-sm font-light text-brand-muted leading-relaxed">
              {useMockData
                ? 'Demo mode — any email and password work.'
                : 'Enter your details to continue.'}
            </p>

            <div className="mt-8 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError('');
                  setInfo('');
                }}
                className={`rounded-full px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  mode === 'signin' ? 'bg-brand-text text-brand-bg' : 'border border-brand-border text-brand-muted'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                  setInfo('');
                }}
                className={`rounded-full px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  mode === 'register' ? 'bg-brand-text text-brand-bg' : 'border border-brand-border text-brand-muted'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {mode === 'register' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="signin-first" className="rsvp-label">First name</label>
                    <input
                      id="signin-first"
                      className="rsvp-field"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="signin-last" className="rsvp-label">Last name</label>
                    <input
                      id="signin-last"
                      className="rsvp-field"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              ) : null}
              <div>
                <label htmlFor="signin-email" className="rsvp-label">Email</label>
                <input
                  id="signin-email"
                  type="email"
                  className="rsvp-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              {mode === 'register' ? (
                <div>
                  <label htmlFor="signin-phone" className="rsvp-label">
                    Mobile <span className="text-brand-muted font-normal normal-case tracking-normal">(optional)</span>
                  </label>
                  <input
                    id="signin-phone"
                    type="tel"
                    className="rsvp-field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              ) : null}
              <div>
                <label htmlFor="signin-password" className="rsvp-label">Password</label>
                <PasswordInput
                  id="signin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                />
              </div>
              {error ? <p className="text-sm text-red-700/90" role="alert">{error}</p> : null}
              {info ? <p className="text-sm text-brand-accent" role="status">{info}</p> : null}
              {pendingVerifyEmail && !useMockData ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-accent hover:text-brand-text"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden />
                  Resend verification email
                </button>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full py-4 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 disabled:opacity-70 transition-colors shadow-sm"
              >
                {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="mt-8 text-center">
              <a
                href={backHref}
                className="text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent hover:text-brand-text"
              >
                ← Back to tickets
              </a>
            </p>

            {!useMockData ? (
              <p className="mt-6 flex justify-center lg:hidden">
                <AmpexWordmark size="sm" />
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
