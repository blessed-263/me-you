import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { loadAttendeeSession } from '../lib/attendeeAuth.ts';
import { useMockData } from '../lib/dataSource.ts';
import { getCustomerProfile } from '../lib/storeApi.ts';
import {
  cartHolderLabels,
  cartTotalTickets,
  saveBuyer,
  TICKETS_PICK,
  TICKETS_PAYMENT,
} from '../lib/mockCheckout.ts';
import TicketsLayout from './TicketsLayout.tsx';
import PurchaseSidebar from './PurchaseSidebar.tsx';
import { useTicketCart } from './useTicketCart.ts';

export default function CheckoutStep() {
  const cart = useTicketCart(true);
  const attendee = loadAttendeeSession();
  const qty = cart ? cartTotalTickets(cart) : 0;

  const [firstName, setFirstName] = useState(() => attendee?.firstName ?? '');
  const [lastName, setLastName] = useState(() => attendee?.lastName ?? '');
  const [email, setEmail] = useState(() => attendee?.email ?? '');
  const [phone, setPhone] = useState(() => attendee?.phone ?? '');
  const [sameNameForAll, setSameNameForAll] = useState(true);
  const [holderNames, setHolderNames] = useState<string[]>(() => Array.from({ length: qty }, () => ''));
  const [error, setError] = useState('');

  const fullName = useMemo(
    () => `${firstName.trim()} ${lastName.trim()}`.trim(),
    [firstName, lastName],
  );

  useEffect(() => {
    setHolderNames((prev) => {
      if (prev.length === qty) return prev;
      return Array.from({ length: qty }, (_, i) => prev[i] ?? '');
    });
  }, [qty]);

  useEffect(() => {
    if (!sameNameForAll) return;
    setHolderNames(Array.from({ length: qty }, () => fullName));
  }, [sameNameForAll, fullName, qty]);

  useEffect(() => {
    if (useMockData) return;
    getCustomerProfile().then((profile) => {
      if (!profile) return;
      if (profile.firstName) setFirstName(profile.firstName);
      if (profile.lastName) setLastName(profile.lastName);
      if (profile.email) setEmail(profile.email);
      if (profile.phone) setPhone(profile.phone);
    });
  }, []);

  if (!cart) return null;

  const holderSlotLabels = cartHolderLabels(cart);

  const updateHolder = (index: number, value: string) => {
    setSameNameForAll(false);
    setHolderNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (attendee && emailTrim !== attendee.email) {
      setError('Checkout must use the email on your signed-in account.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a mobile number for your tickets.');
      return;
    }

    const names = (sameNameForAll
      ? Array.from({ length: qty }, () => fullName)
      : holderNames
    ).map((n) => n.trim());

    if (names.some((n) => !n)) {
      setError(sameNameForAll ? 'Enter your name above.' : `Enter a name for each ticket (${qty}).`);
      return;
    }

    saveBuyer({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailTrim,
      phone: phone.trim(),
      holderNames: names,
    });
    window.location.href = TICKETS_PAYMENT;
  };

  return (
    <TicketsLayout step="checkout" backHref={TICKETS_PICK} backLabel="Tickets">
      <section className="px-5 md:px-12 py-14 md:py-20 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-brand-text mb-2">Your details</h1>
            <p className="text-sm font-light text-brand-muted mb-8 max-w-md leading-relaxed">
              Signed in as <span className="text-brand-text font-medium">{attendee?.email}</span>. Tickets
              will be sent to this email and saved under My tickets.
            </p>

            <form id="ticket-checkout-form" onSubmit={handleSubmit} className="space-y-8 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="firstName" className="rsvp-label">First name</label>
                  <input
                    id="firstName"
                    className="rsvp-field"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="rsvp-label">Last name</label>
                  <input
                    id="lastName"
                    className="rsvp-field"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="rsvp-label">Email</label>
                <input
                  id="email"
                  type="email"
                  className="rsvp-field read-only:opacity-75"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  readOnly={!!attendee}
                />
              </div>

              <div>
                <label htmlFor="phone" className="rsvp-label">Mobile</label>
                <input
                  id="phone"
                  type="tel"
                  className="rsvp-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+27 …"
                />
              </div>

              <div className="border border-brand-border bg-white/30 rounded-sm p-6 md:p-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-accent">
                    Ticket holder names
                  </h2>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameNameForAll}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameNameForAll(checked);
                        if (checked) setHolderNames(Array.from({ length: qty }, () => fullName));
                      }}
                      className="h-3.5 w-3.5 accent-brand-accent"
                    />
                    <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-muted">
                      Same for all tickets
                    </span>
                  </label>
                </div>

                {sameNameForAll ? (
                  <p className="text-sm font-light text-brand-muted leading-relaxed">
                    {qty === 1 ? (
                      <>
                        Ticket issued to{' '}
                        <span className="text-brand-text font-medium">{fullName || '—'}</span>
                      </>
                    ) : (
                      <>
                        All {qty} tickets ({cart.items.map((i) => i.ticketName).join(', ')}) under{' '}
                        <span className="text-brand-text font-medium">{fullName || '—'}</span>
                      </>
                    )}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {holderNames.map((name, i) => (
                      <div key={`holder-${i}`}>
                        <label htmlFor={`holder-${i}`} className="rsvp-label">
                          {holderSlotLabels[i] ?? `Ticket ${i + 1}`}
                        </label>
                        <input
                          id={`holder-${i}`}
                          className="rsvp-field"
                          value={name}
                          onChange={(e) => updateHolder(i, e.target.value)}
                          placeholder="Full legal name"
                          autoComplete="name"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-800 bg-red-50 border border-red-200/80 px-4 py-3 rounded-sm" role="alert">
                  {error}
                </p>
              )}
            </form>
          </div>

          <div className="lg:col-span-5">
            <PurchaseSidebar
              cart={cart}
              showDate={false}
              action={
                <button
                  type="submit"
                  form="ticket-checkout-form"
                  className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors"
                >
                  <Lock className="w-4 h-4" aria-hidden />
                  Continue to payment
                </button>
              }
            />
          </div>
        </div>
      </section>
    </TicketsLayout>
  );
}
