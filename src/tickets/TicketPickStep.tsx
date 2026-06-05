import { Ticket, ShieldCheck, Minus, Plus, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Sponsors from '../components/Sponsors.tsx';
import { formatPrice, type MockEvent, type MockTicketType } from '../lib/mockTickets.ts';
import { fetchEventTickets, fetchPublicEvents } from '../lib/dataSource.ts';
import { isEventEnded, pickDefaultPublicEvent } from '../lib/eventLifecycle.ts';
import {
  loadCart,
  loadSelectedEventId,
  resolveEventIdFromUrl,
  saveCart,
  saveSelectedEventId,
  TICKETS_BASE,
  TICKETS_CHECKOUT,
  type TicketCartSession,
} from '../lib/mockCheckout.ts';
import TicketsLayout from './TicketsLayout.tsx';
import PurchaseSidebar from './PurchaseSidebar.tsx';

function pickEventId(events: MockEvent[]): string | null {
  const urlId = resolveEventIdFromUrl();
  if (urlId && events.some((e) => e.id === urlId)) return urlId;
  const saved = loadSelectedEventId();
  if (saved && events.some((e) => e.id === saved)) return saved;
  const picked = pickDefaultPublicEvent(events);
  return picked?.id ?? null;
}

function buildCartFromQuantities(
  event: MockEvent,
  quantities: Record<string, number>,
  ticketTypes: MockTicketType[],
): TicketCartSession | null {
  const items = ticketTypes
    .filter((t) => (quantities[t.id] ?? 0) > 0)
    .map((t) => ({
      ticketId: t.id,
      ticketName: t.name,
      quantity: quantities[t.id],
      unitPrice: t.price,
      variantId: t.variantId ?? t.id,
    }));
  if (items.length === 0) return null;
  return {
    eventId: event.id,
    eventTitle: event.title,
    items,
  };
}

function quantitiesFromCart(eventId: string): Record<string, number> {
  const cart = loadCart();
  if (!cart || cart.eventId !== eventId) return {};
  return Object.fromEntries(cart.items.map((i) => [i.ticketId, i.quantity]));
}

function TicketLineCard({
  ticket,
  quantity,
  onAdjust,
}: {
  ticket: MockTicketType;
  quantity: number;
  onAdjust: (delta: number) => void;
}) {
  const soldOut = ticket.remaining != null && ticket.remaining < 1;
  const inCart = quantity > 0;
  const maxQty = ticket.remaining != null ? Math.min(10, ticket.remaining) : 10;
  const scarce =
    !soldOut && ticket.remaining != null && ticket.remaining > 0 && ticket.remaining <= 15;

  return (
    <div
      className={`rounded-sm border p-4 md:p-5 transition-all duration-200 ${
        soldOut
          ? 'border-brand-border/60 bg-brand-surface/40 opacity-60'
          : inCart
            ? 'border-brand-accent bg-white/60 shadow-sm ring-1 ring-brand-accent/25'
            : 'border-brand-border bg-white/35'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`font-semibold text-[15px] leading-snug ${
              soldOut ? 'line-through text-brand-muted' : 'text-brand-text'
            }`}
          >
            {ticket.name}
          </p>
          <p className="mt-1.5 text-[13px] font-light leading-[1.6] text-brand-muted">
            {ticket.description}
          </p>
          {scarce && (
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent">
              Only {ticket.remaining} left
            </p>
          )}
          {soldOut && (
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">
              Sold out
            </p>
          )}
        </div>
        <p
          className={`font-serif text-xl md:text-2xl tabular-nums shrink-0 ${
            soldOut ? 'text-brand-muted' : 'text-brand-text'
          }`}
        >
          R {formatPrice(ticket.price)}
        </p>
      </div>

      {!soldOut && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-border/60 pt-4">
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-muted">
            {inCart ? 'In your order' : 'Add to order'}
          </span>
          <div className="flex items-center gap-2">
            {inCart ? (
              <div className="flex items-center border border-brand-border bg-brand-surface/50 rounded-full px-1">
                <button
                  type="button"
                  onClick={() => onAdjust(-1)}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/80 disabled:opacity-40"
                  disabled={quantity <= 0}
                  aria-label={`Remove one ${ticket.name}`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-semibold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => onAdjust(1)}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/80 disabled:opacity-40"
                  disabled={quantity >= maxQty}
                  aria-label={`Add one ${ticket.name}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAdjust(1)}
                className="rounded-full px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors"
              >
                Add
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketPickStep() {
  const [event, setEvent] = useState<MockEvent | null>(null);
  const [ticketTypes, setTicketTypes] = useState<MockTicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const events = await fetchPublicEvents();
        const eventId = pickEventId(events);
        if (!eventId) {
          if (!cancelled) setError('No events available');
          return;
        }
        const picked = events.find((e) => e.id === eventId) ?? null;
        if (!picked) return;
        saveSelectedEventId(eventId);
        const tickets = await fetchEventTickets(eventId);
        if (cancelled) return;
        setEvent(picked);
        setTicketTypes(tickets);
        setQuantities(quantitiesFromCart(eventId));
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'Could not load tickets');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const previewCart = useMemo(
    () => (event ? buildCartFromQuantities(event, quantities, ticketTypes) : null),
    [event, quantities, ticketTypes],
  );

  const getMaxQty = (ticketId: string) => {
    const t = ticketTypes.find((x) => x.id === ticketId);
    if (!t?.remaining) return 10;
    return Math.min(10, t.remaining);
  };

  const adjustLine = (ticketId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[ticketId] ?? 0;
      const next = Math.max(0, Math.min(getMaxQty(ticketId), current + delta));
      const updated = { ...prev };
      if (next === 0) {
        delete updated[ticketId];
      } else {
        updated[ticketId] = next;
      }
      return updated;
    });
  };

  const handleContinue = () => {
    if (!previewCart) return;
    saveCart(previewCart);
    window.location.href = TICKETS_CHECKOUT;
  };

  if (loading) {
    return (
      <TicketsLayout step="select" backHref={TICKETS_BASE} backLabel="Event">
        <section className="px-5 md:px-12 py-20 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-accent" aria-hidden />
          <p className="mt-4 text-sm text-brand-muted">Loading tickets…</p>
        </section>
      </TicketsLayout>
    );
  }

  if (error || !event) {
    return (
      <TicketsLayout step="select" backHref={TICKETS_BASE} backLabel="Event">
        <section className="px-5 md:px-12 py-20 max-w-lg mx-auto text-center">
          <p className="font-serif text-xl text-brand-text">Could not load tickets</p>
          <p className="mt-2 text-sm text-brand-muted">{error || 'Please try again later.'}</p>
          <a href={TICKETS_BASE} className="mt-6 inline-block text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent">
            ← Back to event
          </a>
        </section>
      </TicketsLayout>
    );
  }

  if (isEventEnded(event)) {
    return (
      <TicketsLayout step="select" backHref={TICKETS_BASE} backLabel="Event">
        <section className="px-5 md:px-12 py-20 max-w-lg mx-auto text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-muted">Ended</p>
          <p className="mt-3 font-serif text-2xl text-brand-text">{event.title}</p>
          <p className="mt-3 text-sm text-brand-muted leading-relaxed">
            This edition has ended. Tickets are no longer available for purchase.
          </p>
          <a href={TICKETS_BASE} className="mt-8 inline-block text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent">
            ← View all editions
          </a>
        </section>
      </TicketsLayout>
    );
  }

  return (
    <TicketsLayout step="select" backHref={TICKETS_BASE} backLabel="Event">
      <section className="px-5 md:px-12 pt-8 pb-12 md:pb-16 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-brand-text">
                Choose your experiences
              </h1>
              <p className="mt-2 text-sm font-light text-brand-muted leading-relaxed">
                Add one or more ticket types for {event.title}.
              </p>
            </div>

            <div className="space-y-3" aria-label="Ticket types">
              {ticketTypes.map((ticket) => (
                <div key={ticket.id}>
                  <TicketLineCard
                    ticket={ticket}
                    quantity={quantities[ticket.id] ?? 0}
                    onAdjust={(delta) => adjustLine(ticket.id, delta)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            {previewCart ? (
              <PurchaseSidebar
                cart={previewCart}
                onAdjustLineQty={adjustLine}
                getMaxQty={getMaxQty}
                action={
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors"
                  >
                    <Ticket className="w-4 h-4" aria-hidden />
                    Continue to checkout
                  </button>
                }
              />
            ) : (
              <div className="lg:sticky lg:top-28 border border-dashed border-brand-border bg-white/20 p-8 text-center">
                <p className="font-serif text-xl text-brand-muted">Your order is empty</p>
                <p className="mt-2 text-sm font-light text-brand-muted">
                  Add at least one ticket type to continue.
                </p>
              </div>
            )}
            <p className="mt-4 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-brand-accent lg:hidden">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure checkout
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-brand-border/50 py-12 px-6 md:px-12 flex flex-col items-center gap-6 bg-brand-bg">
        <Sponsors className="max-w-5xl mx-auto" />
        <p className="text-[9px] uppercase tracking-[0.3em] text-brand-muted/60">
          © {new Date().getFullYear()} You & Me Africa
        </p>
      </footer>
    </TicketsLayout>
  );
}
