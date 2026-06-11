import { describe, expect, it } from 'vitest';
import { clearCheckoutSession, saveCart, loadCart } from './mockCheckout.ts';

describe('mock checkout storage', () => {
  it('persists and restores cart session', () => {
    saveCart({
      eventId: 'evt_1',
      eventTitle: 'You & Me',
      items: [{ ticketId: 'tt_1', ticketName: 'General', quantity: 2, unitPrice: 600 }],
    });

    const cart = loadCart();
    expect(cart?.eventId).toBe('evt_1');
    expect(cart?.items[0]?.quantity).toBe(2);

    clearCheckoutSession();
    expect(loadCart()).toBeNull();
  });
});
