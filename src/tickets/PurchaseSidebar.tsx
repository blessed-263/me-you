import type { ReactNode } from 'react';
import { Minus, Plus, ShieldCheck } from 'lucide-react';
import { formatEventDate, formatPrice } from '../lib/mockTickets.ts';
import { MOCK_EVENT } from '../lib/mockTickets.ts';
import type { TicketCartSession } from '../lib/mockCheckout.ts';
import { cartSubtotal, cartTotalTickets } from '../lib/mockCheckout.ts';

type PurchaseSidebarProps = {
  cart: TicketCartSession;
  onAdjustLineQty?: (ticketId: string, delta: number) => void;
  getMaxQty?: (ticketId: string) => number;
  action: ReactNode;
  showDate?: boolean;
};

export default function PurchaseSidebar({
  cart,
  onAdjustLineQty,
  getMaxQty,
  action,
  showDate = true,
}: PurchaseSidebarProps) {
  const total = cartSubtotal(cart);
  const ticketCount = cartTotalTickets(cart);

  return (
    <div className="lg:sticky lg:top-28 space-y-5">
      <div className="border border-brand-border bg-white/40 backdrop-blur-sm p-6 md:p-8 space-y-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-brand-border pb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-brand-muted">
              Your order
            </p>
            <p className="mt-2 font-serif text-3xl tabular-nums text-brand-text">R {formatPrice(total)}</p>
            <p className="mt-1 text-[12px] text-brand-muted">
              {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-accent px-2.5 py-1 border border-brand-accent/30 rounded-full shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
            Secure
          </span>
        </div>

        <ul className="space-y-3">
          {cart.items.map((item) => (
            <li
              key={item.ticketId}
              className="flex items-center justify-between gap-3 text-sm border-b border-brand-border/60 pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-brand-text text-[13px] leading-snug truncate">
                  {item.ticketName}
                </p>
                <p className="text-[11px] text-brand-muted tabular-nums">
                  R {formatPrice(item.unitPrice)} each
                </p>
              </div>
              {onAdjustLineQty ? (
                <div className="flex items-center gap-1 shrink-0 border border-brand-border bg-brand-surface/50 rounded-full px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => onAdjustLineQty(item.ticketId, -1)}
                    disabled={item.quantity <= 1}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/80 disabled:opacity-35"
                    aria-label={`Decrease ${item.ticketName}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onAdjustLineQty(item.ticketId, 1)}
                    disabled={item.quantity >= (getMaxQty?.(item.ticketId) ?? 10)}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/80 disabled:opacity-35"
                    aria-label={`Increase ${item.ticketName}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-sm font-semibold tabular-nums shrink-0">× {item.quantity}</span>
              )}
            </li>
          ))}
        </ul>

        <div className="flex justify-between text-sm px-1 pt-1">
          <span className="text-brand-muted">Subtotal</span>
          <span className="font-semibold tabular-nums">R {formatPrice(total)}</span>
        </div>

        {action}

        <p className="text-[11px] leading-relaxed text-brand-muted/80 text-center">
          Tickets are issued digitally after payment. Non-refundable within 24 hours of the event.
        </p>
      </div>

      {showDate && (
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-brand-muted/70">
          {formatEventDate(MOCK_EVENT.date)}
        </p>
      )}
    </div>
  );
}
