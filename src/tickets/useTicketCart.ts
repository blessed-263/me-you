import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartHasItems, loadCart, TICKETS_PICK, type TicketCartSession } from '../lib/mockCheckout.ts';

/** Stable cart from session — avoids re-parsing every render (which broke controlled inputs). */
export function useTicketCart(requireCart = true) {
  const navigate = useNavigate();
  const [cart] = useState<TicketCartSession | null>(() => loadCart());

  useEffect(() => {
    if (!requireCart) return;
    if (!cart || !cartHasItems(cart)) {
      navigate(TICKETS_PICK, { replace: true });
    }
  }, [requireCart, cart, navigate]);

  return cart;
}
