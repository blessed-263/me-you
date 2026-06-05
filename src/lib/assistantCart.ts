import { fetchEventTickets, fetchPublicEvents, useMockData } from './dataSource.ts';
import { cartHasItems, loadCart, saveCart, saveSelectedEventId, type TicketCartSession } from './mockCheckout.ts';
import { MOCK_EVENT } from './mockTickets.ts';

export type TicketCatalogItem = {
  id: string;
  name: string;
  price: number;
  variantId?: string;
};

export const ASSISTANT_TICKETS: TicketCatalogItem[] = MOCK_EVENT.ticketTypes.map((t) => ({
  id: t.id,
  name: t.name,
  price: t.price,
  variantId: t.variantId ?? t.id,
}));

async function resolveTicketCatalog(): Promise<{ eventId: string; eventTitle: string; tickets: TicketCatalogItem[] }> {
  if (useMockData) {
    return {
      eventId: MOCK_EVENT.id,
      eventTitle: MOCK_EVENT.title,
      tickets: ASSISTANT_TICKETS,
    };
  }
  const events = await fetchPublicEvents();
  const event = events[0];
  if (!event) throw new Error('No events available.');
  const tickets = await fetchEventTickets(event.id);
  return {
    eventId: event.id,
    eventTitle: event.title,
    tickets: tickets.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
      variantId: t.variantId ?? t.id,
    })),
  };
}

export async function addTicketToCart(
  ticketId: string,
  quantity: number,
): Promise<{ ok: true; cart: TicketCartSession } | { ok: false; error: string }> {
  try {
    const { eventId, eventTitle, tickets } = await resolveTicketCatalog();
    const ticket = tickets.find((t) => t.id === ticketId || t.variantId === ticketId);
    if (!ticket) return { ok: false, error: 'Unknown ticket type.' };
    const qty = Math.max(1, Math.min(10, Math.floor(quantity)));

    const existing = loadCart();
    const items = existing?.eventId === eventId ? [...existing.items] : [];
    const lineId = ticket.id;
    const idx = items.findIndex((i) => i.ticketId === lineId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: items[idx].quantity + qty };
    } else {
      items.push({
        ticketId: lineId,
        ticketName: ticket.name,
        quantity: qty,
        unitPrice: ticket.price,
        variantId: ticket.variantId ?? ticket.id,
      });
    }

    const cart: TicketCartSession = {
      eventId,
      eventTitle,
      items,
    };
    saveCart(cart);
    saveSelectedEventId(eventId);
    return { ok: true, cart };
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'Could not add to cart.' };
  }
}

export function cartSummaryLine(): string | null {
  const cart = loadCart();
  if (!cart || !cartHasItems(cart)) return null;
  const lines = cart.items.map((i) => `${i.quantity}× ${i.ticketName}`);
  return lines.join(', ');
}
