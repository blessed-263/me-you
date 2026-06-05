import { useState, type FormEvent } from 'react';
import { Lock, Mail } from 'lucide-react';
import {
  loadAttendeeSession,
  loginAttendeeAsync,
  parseTicketsReturnTo,
  registerAttendeeAsync,
} from '../lib/attendeeAuth.ts';
import { useMockData } from '../lib/dataSource.ts';
import { resendVerification } from '../lib/storeApi.ts';
import { TICKETS_BASE } from '../lib/mockCheckout.ts';
import TicketsLayout from './TicketsLayout.tsx';

type Mode = 'signin' | 'register';

export default function AttendeeLoginPage() {
  const existing = loadAttendeeSession();
  if (existing) {
    window.location.replace(parseTicketsReturnTo());
    return null;
  }

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
        await loginAttendeeAsync(email, password);
        window.location.href = parseTicketsReturnTo();
        return;
      }

      if (!email.trim() || !password.trim()) {
        setError('Enter your email and password.');
        return;
      }
      await loginAttendeeAsync(email, password);
      window.location.href = parseTicketsReturnTo();
    } catch (e) {
      const err = e as Error & { code?: string; status?: number };
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setPendingVerifyEmail(email.trim().toLowerCase());
        setError('Please verify your email before signing in.');
      } else {
        setError(err.message || 'Sign in failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TicketsLayout step="select" backHref={TICKETS_BASE} backLabel="Event" showSteps={false}>
      <section className="px-5 md:px-12 py-14 md:py-20 max-w-[520px] mx-auto">
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent flex items-center gap-3">
          <span className="w-8 h-px bg-brand-accent/50" />
          Account
        </p>
        <h1 className="mt-4 font-serif text-3xl md:text-4xl font-semibold text-brand-text">
          {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
        </h1>
        <p className="mt-3 text-sm font-light text-brand-muted leading-relaxed">
          {useMockData
            ? 'You need an account to purchase tickets. Demo sign-in — any password works.'
            : 'Sign in or register to purchase tickets and view them later.'}
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
                <label htmlFor="att-first" className="rsvp-label">First name</label>
                <input
                  id="att-first"
                  className="rsvp-field"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label htmlFor="att-last" className="rsvp-label">Last name</label>
                <input
                  id="att-last"
                  className="rsvp-field"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>
          ) : null}
          <div>
            <label htmlFor="att-email" className="rsvp-label">Email</label>
            <input
              id="att-email"
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
              <label htmlFor="att-phone" className="rsvp-label">
                Mobile <span className="text-brand-muted font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="att-phone"
                type="tel"
                className="rsvp-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          ) : null}
          <div>
            <label htmlFor="att-password" className="rsvp-label">Password</label>
            <input
              id="att-password"
              type="password"
              className="rsvp-field"
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
            className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 disabled:opacity-70 transition-colors"
          >
            <Lock className="w-4 h-4" aria-hidden />
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {useMockData ? (
          <p className="mt-8 text-center text-[11px] text-brand-muted leading-relaxed">
            Demo: try <span className="text-brand-text font-medium">thabo.m@example.com</span> to see sample
            tickets after sign-in.
          </p>
        ) : null}
      </section>
    </TicketsLayout>
  );
}
