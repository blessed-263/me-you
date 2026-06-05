import { useEffect, useState } from 'react';
import { CreditCard, Loader2, Lock } from 'lucide-react';
import { formatPrice } from '../lib/mockTickets.ts';
import { useMockData } from '../lib/dataSource.ts';
import {
  buildMockOrder,
  cartSubtotal,
  createMockReference,
  loadBuyer,
  saveOrder,
  TICKETS_CHECKOUT,
  TICKETS_SUCCESS,
  type BuyerDetails,
} from '../lib/mockCheckout.ts';
import { addItemsToCart, createCart, startPaystackCheckout } from '../lib/storeApi.ts';
import TicketsLayout from './TicketsLayout.tsx';
import PurchaseSidebar from './PurchaseSidebar.tsx';
import { useTicketCart } from './useTicketCart.ts';

const MOCK_PAY_DELAY_MS = 2200;

export default function PaymentStep() {
  const cart = useTicketCart(true);
  const [buyer] = useState<BuyerDetails | null>(() => loadBuyer());
  const [paying, setPaying] = useState(false);
  const [cardNumber, setCardNumber] = useState('4084 0840 8408 4081');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('408');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!buyer) window.location.replace(TICKETS_CHECKOUT);
  }, [buyer]);

  if (!cart || !buyer) return null;

  const total = cartSubtotal(cart);

  const handleMockPay = async () => {
    setError('');
    if (!cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      setError('Enter a 16-digit card number (mock: any 16 digits).');
      return;
    }
    setPaying(true);
    await new Promise((r) => window.setTimeout(r, MOCK_PAY_DELAY_MS));
    const reference = createMockReference();
    saveOrder(buildMockOrder(cart, buyer, reference));
    window.location.href = `${TICKETS_SUCCESS}?reference=${encodeURIComponent(reference)}`;
  };

  const handleLivePay = async () => {
    setError('');
    setPaying(true);
    try {
      const holderNames = [...buyer.holderNames];
      let nameIdx = 0;
      const cartId = await createCart();
      await addItemsToCart(
        cartId,
        cart.items.map((item) => {
          const names: string[] = [];
          for (let i = 0; i < item.quantity; i++) {
            names.push(holderNames[nameIdx++] ?? `${buyer.firstName} ${buyer.lastName}`.trim());
          }
          return {
            variantId: item.variantId ?? item.ticketId,
            quantity: item.quantity,
            unitPriceZar: item.unitPrice,
            eventId: cart.eventId,
            holderNames: names,
          };
        }),
      );
      const { paymentUrl } = await startPaystackCheckout(cartId, buyer.email);
      window.location.href = paymentUrl;
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === 'insufficient_inventory') {
        setError('Some tickets are no longer available. Return to ticket selection and try again.');
      } else {
        setError(err.message || 'Could not start payment.');
      }
      setPaying(false);
    }
  };

  const handlePay = () => (useMockData ? handleMockPay() : handleLivePay());

  return (
    <TicketsLayout step="payment" backHref={TICKETS_CHECKOUT} backLabel="Details">
      <section className="px-5 md:px-12 py-14 md:py-20 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent mb-2">
                {useMockData ? 'Preview — mock checkout' : 'Secure payment'}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-brand-text mb-2">Payment</h1>
              <p className="text-sm font-light text-brand-muted">
                {useMockData
                  ? 'Simulated Paystack — no real payment is processed.'
                  : 'You will be redirected to Paystack to complete payment.'}
              </p>
            </div>

            {useMockData ? (
              <div className="border border-brand-border bg-white/50 overflow-hidden shadow-sm max-w-lg">
                <div className="flex items-center justify-between px-5 py-4 bg-[#0b5b44] text-white">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Paystack</span>
                  <span className="text-[9px] uppercase tracking-widest text-white/80">Test mode</span>
                </div>

                <div className="p-6 md:p-8 space-y-5">
                  <div className="flex justify-between items-baseline border-b border-brand-border pb-4">
                    <span className="text-sm text-brand-muted">Amount due</span>
                    <span className="font-serif text-2xl tabular-nums text-brand-text">
                      R {formatPrice(total)}
                    </span>
                  </div>

                  <p className="text-[12px] text-brand-muted">
                    Paying as <strong className="text-brand-text font-medium">{buyer.email}</strong>
                  </p>

                  <div>
                    <label htmlFor="card" className="rsvp-label">Card number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-[calc(50%+0.3rem)] -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
                      <input
                        id="card"
                        className="rsvp-field pl-10"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        disabled={paying}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="expiry" className="rsvp-label">Expiry</label>
                      <input
                        id="expiry"
                        className="rsvp-field"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        disabled={paying}
                      />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="rsvp-label">CVV</label>
                      <input
                        id="cvv"
                        className="rsvp-field"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        disabled={paying}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-brand-border bg-white/50 p-6 md:p-8 max-w-lg space-y-4">
                <div className="flex justify-between items-baseline border-b border-brand-border pb-4">
                  <span className="text-sm text-brand-muted">Amount due</span>
                  <span className="font-serif text-2xl tabular-nums text-brand-text">
                    R {formatPrice(total)}
                  </span>
                </div>
                <p className="text-[12px] text-brand-muted leading-relaxed">
                  Paying as <strong className="text-brand-text font-medium">{buyer.email}</strong>. Click
                  below to open Paystack in a secure window.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-800 bg-red-50 border border-red-200/80 px-4 py-3 rounded-sm max-w-lg" role="alert">
                {error}
              </p>
            )}

            {paying && (
              <p className="text-[12px] text-brand-muted" role="status">
                {useMockData ? 'Confirming payment and issuing tickets…' : 'Redirecting to Paystack…'}
              </p>
            )}
          </div>

          <div className="lg:col-span-5">
            <PurchaseSidebar
              cart={cart}
              showDate={false}
              action={
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-[10px] font-semibold uppercase tracking-[0.14em] bg-[#0b5b44] text-white hover:bg-[#094a38] disabled:opacity-70 transition-colors"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" aria-hidden />
                      Pay R {formatPrice(total)}
                    </>
                  )}
                </button>
              }
            />
          </div>
        </div>
      </section>
    </TicketsLayout>
  );
}
