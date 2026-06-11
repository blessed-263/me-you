import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { finalizePaystackPayment, getMedusaCartId } from '../lib/storeApi.ts';
import {
  loadBuyer,
  loadCart,
  saveOrder,
  TICKETS_CHECKOUT,
  TICKETS_SUCCESS,
} from '../lib/mockCheckout.ts';
import TicketsLayout from './TicketsLayout.tsx';

export default function PaymentCallbackStep() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams(search);
      const reference =
        params.get('reference')?.trim() ||
        params.get('trxref')?.trim() ||
        sessionStorage.getItem('payment_reference') ||
        '';
      const cartId = getMedusaCartId();
      const buyer = loadBuyer();
      const cart = loadCart();

      if (!reference || !cartId || !buyer || !cart) {
        if (!cancelled) {
          setError('Payment session expired. Please try checkout again.');
        }
        return;
      }

      try {
        const { orderId } = await finalizePaystackPayment(cartId, reference);
        saveOrder({
          orderId,
          reference,
          paidAt: new Date().toISOString(),
          cart,
          buyer,
        });
        navigate(
          `${TICKETS_SUCCESS}?reference=${encodeURIComponent(reference)}&order=${encodeURIComponent(orderId)}`,
          { replace: true },
        );
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || 'Payment could not be confirmed.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, search]);

  return (
    <TicketsLayout step="payment" showSteps={false} backHref={TICKETS_CHECKOUT} backLabel="Checkout">
      <section className="px-5 md:px-12 py-24 max-w-lg mx-auto text-center">
        {error ? (
          <>
            <p className="font-serif text-2xl text-brand-text">Payment issue</p>
            <p className="mt-3 text-sm text-brand-muted" role="alert">
              {error}
            </p>
            <a
              href={TICKETS_CHECKOUT}
              className="mt-8 inline-block text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent"
            >
              Return to checkout
            </a>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-accent" aria-hidden />
            <p className="mt-6 text-sm text-brand-muted" role="status">
              Confirming your payment…
            </p>
          </>
        )}
      </section>
    </TicketsLayout>
  );
}
