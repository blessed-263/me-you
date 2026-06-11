import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Download, Mail, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { formatEventDate, formatPrice } from '../lib/mockTickets.ts';
import { resolvePublicEventStatus } from '../lib/eventLifecycle.ts';
import { ticketPartFromType } from '../lib/ticketVisuals.ts';
import { VENUE_ADDRESS_ONE_LINE } from '../lib/venue.ts';
import { fetchEventById, useMockData } from '../lib/dataSource.ts';
import {
  cartSubtotal,
  clearCheckoutSession,
  loadOrder,
  TICKETS_BASE,
  TICKETS_MY,
  type MockOrder,
} from '../lib/mockCheckout.ts';
import { appendMockOrder } from '../lib/mockOrganizer.ts';
import TicketsLayout from './TicketsLayout.tsx';

export default function SuccessStep() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const referenceFromUrl = useMemo(
    () => new URLSearchParams(search).get('reference') || '',
    [search],
  );
  const orderIdFromUrl = useMemo(
    () => new URLSearchParams(search).get('order') || '',
    [search],
  );
  const [order] = useState<MockOrder | null>(() => loadOrder());
  const [eventDateLabel, setEventDateLabel] = useState('');
  const [eventStatusLabel, setEventStatusLabel] = useState('active');
  const [eventTitle, setEventTitle] = useState('');
  const [eventEdition, setEventEdition] = useState('');

  useEffect(() => {
    if (!order) navigate(TICKETS_BASE, { replace: true });
  }, [order, navigate]);

  useEffect(() => {
    if (order && useMockData) appendMockOrder(order);
  }, [order]);

  useEffect(() => {
    if (!order) return;
    fetchEventById(order.cart.eventId).then((event) => {
      if (event) {
        setEventDateLabel(formatEventDate(event.date));
        setEventStatusLabel(resolvePublicEventStatus(event.publicStatus, event.date));
        setEventTitle(event.title);
        setEventEdition(event.subtitle || '');
      }
    });
  }, [order]);

  if (!order) return null;

  const total = cartSubtotal(order.cart);
  const refDisplay = referenceFromUrl || order.reference;
  const orderIdDisplay = orderIdFromUrl || order.orderId;

  return (
    <TicketsLayout step="success" showSteps={false} backHref="/" backLabel="Home">
      <section className="px-5 md:px-12 py-16 md:py-24 max-w-[720px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent mb-8"
        >
          <Check className="w-8 h-8 stroke-[2]" aria-hidden />
        </motion.div>

        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-brand-text mb-3">
          You&apos;re in
        </h1>
        <p className="text-sm font-light text-brand-muted max-w-md mx-auto leading-relaxed mb-10">
          Payment confirmed. Your tickets will be emailed to{' '}
          <span className="text-brand-text font-medium">{order.buyer.email}</span>.
        </p>

        <div className="border border-brand-border bg-white/40 text-left p-6 md:p-8 space-y-5 mb-10 shadow-sm">
          <div className="flex justify-between gap-4 text-sm border-b border-brand-border pb-4">
            <span className="text-brand-muted">Order</span>
            <span className="font-mono text-[12px] text-brand-text break-all">{orderIdDisplay}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-brand-muted">Reference</span>
            <span className="font-mono text-[12px] font-semibold text-brand-accent">{refDisplay}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-brand-muted">Event</span>
            <span className="text-brand-text text-right">{eventTitle || order.cart.eventTitle}</span>
          </div>
          {eventDateLabel ? (
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-brand-muted">Date</span>
              <span className="text-brand-text">{eventDateLabel}</span>
            </div>
          ) : null}
          <div className="space-y-2 text-sm border-b border-brand-border pb-4">
            <span className="text-brand-muted block mb-1">Tickets</span>
            {order.cart.items.map((item) => (
              <div key={item.ticketId} className="rounded-sm border border-brand-border/60 bg-white/70 p-3">
                <div className="flex justify-between gap-3">
                  <span className="text-brand-text">{item.ticketName}</span>
                  <span className="tabular-nums shrink-0">× {item.quantity}</span>
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-brand-accent">
                  {ticketPartFromType(item.ticketName)}{eventEdition ? ` · ${eventEdition}` : ''}
                </p>
                <p className="mt-1 text-[12px] text-brand-muted">
                  {eventDateLabel || 'Date TBA'} · {VENUE_ADDRESS_ONE_LINE}
                </p>
              </div>
            ))}
          </div>
          <ul className="text-[13px] text-brand-muted space-y-1 border-t border-brand-border pt-4">
            {order.buyer.holderNames.map((name, i) => (
              <li key={i}>
                Ticket {i + 1}: <span className="text-brand-text">{name}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-baseline border-t border-brand-border pt-4">
            <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-muted">Paid</span>
            <span className="font-serif text-2xl tabular-nums">R {formatPrice(total)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() =>
              window.alert(useMockData ? 'Mock: PDF tickets would download here.' : 'Tickets are in your email and My tickets.')
            }
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] border border-brand-border text-brand-text hover:bg-brand-surface transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden />
            Download tickets
          </button>
          <a
            href={TICKETS_MY}
            onClick={() => clearCheckoutSession()}
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors"
          >
            <Ticket className="w-4 h-4" aria-hidden />
            View my tickets
          </a>
        </div>

        <p className="mt-10 inline-flex items-center gap-2 text-[11px] text-brand-muted">
          <Mail className="w-4 h-4" aria-hidden />
          Confirmation sent to your email · {eventStatusLabel}
        </p>
      </section>
    </TicketsLayout>
  );
}
