import { useEffect, useState } from 'react';
import { cartHasItems, loadCart, TICKETS_PICK, type TicketCartSession } from '../lib/mockCheckout.ts';

/** Stable cart from session — avoids re-parsing every render (which broke controlled inputs). */
export function useTicketCart(requireCart = true) {
  const [cart, setCart] = useState<TicketCartSession | null>(() => loadCart());

  useEffect(() => {
    if (!requireCart) return;
    if (!cart || !cartHasItems(cart)) {
      window.location.replace(TICKETS_PICK);
    }
  }, [requireCart, cart]);

  return cart;
}
