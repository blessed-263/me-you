import { MOCK_EVENT } from './mockTickets.ts';

export type TicketCartLineItem = {
  ticketId: string;
  ticketName: string;
  quantity: number;
  unitPrice: number;
  variantId?: string;
};

export type TicketCartSession = {
  eventId: string;
  eventTitle: string;
  items: TicketCartLineItem[];
};

export type BuyerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  holderNames: string[];
};

export type MockOrder = {
  orderId: string;
  reference: string;
  paidAt: string;
  cart: TicketCartSession;
  buyer: BuyerDetails;
};

const CART_KEY = 'yme_ticket_cart';
const BUYER_KEY = 'yme_ticket_buyer';
const ORDER_KEY = 'yme_ticket_order';

/** @deprecated Legacy single-line cart shape */
type LegacyCart = {
  eventId: string;
  eventTitle: string;
  ticketId: string;
  ticketName: string;
  quantity: number;
  unitPrice: number;
};

function isLegacyCart(raw: unknown): raw is LegacyCart {
  const o = raw as LegacyCart;
  return Boolean(o?.ticketId && !Array.isArray((raw as TicketCartSession).items));
}

function normalizeCart(raw: unknown): TicketCartSession | null {
  if (!raw || typeof raw !== 'object') return null;
  if (isLegacyCart(raw)) {
    return {
      eventId: raw.eventId,
      eventTitle: raw.eventTitle,
      items: [
        {
          ticketId: raw.ticketId,
          ticketName: raw.ticketName,
          quantity: raw.quantity,
          unitPrice: raw.unitPrice,
        },
      ],
    };
  }
  const cart = raw as TicketCartSession;
  if (!cart.eventId || !Array.isArray(cart.items)) return null;
  return {
    eventId: cart.eventId,
    eventTitle: cart.eventTitle,
    items: cart.items.filter((i) => i.quantity > 0),
  };
}

export function cartSubtotal(cart: TicketCartSession): number {
  return cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function cartTotalTickets(cart: TicketCartSession): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartHasItems(cart: TicketCartSession): boolean {
  return cart.items.length > 0 && cartTotalTickets(cart) > 0;
}

export function cartHolderLabels(cart: TicketCartSession): string[] {
  const labels: string[] = [];
  const multiType = cart.items.filter((i) => i.quantity > 0).length > 1;
  for (const item of cart.items) {
    for (let i = 0; i < item.quantity; i++) {
      const n = labels.length + 1;
      labels.push(
        multiType || item.quantity > 1
          ? `${item.ticketName} — Guest ${i + 1}`
          : `Ticket ${n}`,
      );
    }
  }
  return labels;
}

export function saveCart(cart: TicketCartSession): void {
  sessionStorage.setItem(
    CART_KEY,
    JSON.stringify({
      ...cart,
      items: cart.items.filter((i) => i.quantity > 0),
    }),
  );
}

export function loadCart(): TicketCartSession | null {
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    if (!raw) return null;
    return normalizeCart(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearCart(): void {
  sessionStorage.removeItem(CART_KEY);
}

export function saveBuyer(buyer: BuyerDetails): void {
  sessionStorage.setItem(BUYER_KEY, JSON.stringify(buyer));
}

export function loadBuyer(): BuyerDetails | null {
  try {
    const raw = sessionStorage.getItem(BUYER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BuyerDetails;
  } catch {
    return null;
  }
}

export function saveOrder(order: MockOrder): void {
  sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
}

export function loadOrder(): MockOrder | null {
  try {
    const raw = sessionStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    const order = JSON.parse(raw) as MockOrder;
    const cart = normalizeCart(order.cart);
    if (!cart) return null;
    return { ...order, cart };
  } catch {
    return null;
  }
}

export function clearCheckoutSession(): void {
  sessionStorage.removeItem(CART_KEY);
  sessionStorage.removeItem(BUYER_KEY);
  sessionStorage.removeItem(ORDER_KEY);
}

export function createMockReference(): string {
  const part = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `YME-MOCK-${part}`;
}

export function createMockOrderId(): string {
  return `ord_mock_${Date.now().toString(36)}`;
}

export function buildMockOrder(
  cart: TicketCartSession,
  buyer: BuyerDetails,
  reference: string,
): MockOrder {
  return {
    orderId: createMockOrderId(),
    reference,
    paidAt: new Date().toISOString(),
    cart,
    buyer,
  };
}

export const TICKETS_BASE = '/tickets';
export const TICKETS_LOGIN = '/tickets/login';
export const TICKETS_MY = '/tickets/my-tickets';
export const TICKETS_PICK = '/tickets/pick';
export const TICKETS_CHECKOUT = '/tickets/checkout';
export const TICKETS_PAYMENT = '/tickets/payment';
export const TICKETS_PAYMENT_CALLBACK = '/tickets/payment/callback';
export const TICKETS_SUCCESS = '/tickets/success';

const SELECTED_EVENT_KEY = 'yme_selected_event_id';

export function saveSelectedEventId(eventId: string): void {
  sessionStorage.setItem(SELECTED_EVENT_KEY, eventId);
}

export function loadSelectedEventId(): string | null {
  try {
    return sessionStorage.getItem(SELECTED_EVENT_KEY);
  } catch {
    return null;
  }
}

export function resolveEventIdFromUrl(): string | null {
  const q = new URLSearchParams(window.location.search).get('event');
  return q?.trim() || null;
}

export const TICKETS_PROTECTED_PATHS = [
  TICKETS_PICK,
  TICKETS_CHECKOUT,
  TICKETS_PAYMENT,
  TICKETS_SUCCESS,
  TICKETS_MY,
] as const;

export const MOCK_EVENT_TITLE = MOCK_EVENT.title;
