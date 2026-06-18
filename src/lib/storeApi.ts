import { AMPEX, fetchStore, fetchStoreJson } from './ampexConfig.ts';
import { extractLoginToken, setAttendeeToken } from './sessionTokens.ts';
import {
  mapBackendEventToMockEvent,
  mapTicketsEndpoint,
  type ApiTicketType,
} from './eventMappers.ts';
import { sortPublicEvents } from './eventLifecycle.ts';
import type { MockEvent } from './mockTickets.ts';
import { TICKETS_PAYMENT_CALLBACK, type BuyerDetails } from './mockCheckout.ts';

const MEDUSA_CART_KEY = 'medusa_cart_id';
const PAYMENT_CART_KEY = 'payment_cart_id';
const PAYMENT_SESSION_KEY = 'payment_session_id';
const PAYMENT_COLLECTION_KEY = 'payment_collection_id';

export function getMedusaCartId(): string | null {
  return sessionStorage.getItem(MEDUSA_CART_KEY) ?? sessionStorage.getItem(PAYMENT_CART_KEY);
}

export function setMedusaCartId(id: string | null): void {
  if (id) {
    sessionStorage.setItem(MEDUSA_CART_KEY, id);
    sessionStorage.setItem(PAYMENT_CART_KEY, id);
  } else {
    sessionStorage.removeItem(MEDUSA_CART_KEY);
    sessionStorage.removeItem(PAYMENT_CART_KEY);
  }
}

export function clearPaymentState(): void {
  sessionStorage.removeItem(PAYMENT_SESSION_KEY);
  sessionStorage.removeItem(PAYMENT_COLLECTION_KEY);
  sessionStorage.removeItem('payment_reference');
  setMedusaCartId(null);
}

export async function listOrganizerPublicEvents(): Promise<MockEvent[]> {
  const params = new URLSearchParams({ limit: '50' });
  if (AMPEX.ORGANIZER_ID) params.set('organizer_id', AMPEX.ORGANIZER_ID);
  const data = await fetchStoreJson<{ events?: Record<string, unknown>[] }>(
    `/store/events?${params}`,
  );
  const events = (data.events ?? []).map((e) => mapBackendEventToMockEvent(e));
  return sortPublicEvents(events);
}

export async function getEvent(eventId: string): Promise<MockEvent | null> {
  try {
    const data = await fetchStoreJson<{ event?: Record<string, unknown> }>(
      `/store/events/${eventId}`,
    );
    const raw = data.event ?? (data as Record<string, unknown>);
    if (!raw || typeof raw !== 'object') return null;
    return mapBackendEventToMockEvent(raw as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getEventTickets(eventId: string): Promise<ApiTicketType[]> {
  const data = await fetchStoreJson<{
    ticket_types?: Record<string, unknown>[];
    ticketTypes?: Record<string, unknown>[];
  }>(`/store/events/${eventId}/tickets`);
  return mapTicketsEndpoint(data);
}

export async function customerRegister(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<{ email: string; verificationRequired: boolean }> {
  await fetchStoreJson('/store/customers/register', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      phone: input.phone?.trim() || undefined,
    }),
  });
  return { email: input.email.trim().toLowerCase(), verificationRequired: true };
}

export async function customerLogin(
  email: string,
  password: string,
): Promise<{ email: string; firstName: string; lastName: string }> {
  const data = await fetchStoreJson<{
    user?: { email?: string; first_name?: string; last_name?: string };
    token?: string;
    access_token?: string;
  }>('/store/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const token = extractLoginToken(data);
  if (token) {
    setAttendeeToken(token);
    invalidateCustomerProfileCache();
    invalidateMyTicketsCache();
  }
  if (!data.user?.email) {
    throw new Error('Login failed');
  }
  return {
    email: data.user.email,
    firstName: data.user.first_name ?? '',
    lastName: data.user.last_name ?? '',
  };
}

export async function resendVerification(email: string): Promise<void> {
  await fetchStoreJson('/store/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

let customerProfileCache: { data: BuyerDetails | null; fetchedAt: number } | null = null;
let customerProfileInFlight: Promise<BuyerDetails | null> | null = null;
const CUSTOMER_PROFILE_CACHE_MS = 30_000;

export function invalidateCustomerProfileCache(): void {
  customerProfileCache = null;
}

export async function getCustomerProfile(): Promise<BuyerDetails | null> {
  const now = Date.now();
  if (customerProfileCache && now - customerProfileCache.fetchedAt < CUSTOMER_PROFILE_CACHE_MS) {
    return customerProfileCache.data;
  }

  if (customerProfileInFlight) {
    return customerProfileInFlight;
  }

  customerProfileInFlight = (async () => {
    try {
      const data = await fetchStoreJson<{
        customer?: {
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
        };
      }>('/store/customers/profile');
      const c = data.customer;
      if (!c) {
        customerProfileCache = { data: null, fetchedAt: Date.now() };
        return null;
      }
      const profile: BuyerDetails = {
        firstName: c.first_name ?? '',
        lastName: c.last_name ?? '',
        email: c.email ?? '',
        phone: c.phone ?? '',
        holderNames: [],
      };
      customerProfileCache = { data: profile, fetchedAt: Date.now() };
      return profile;
    } catch {
      return null;
    } finally {
      customerProfileInFlight = null;
    }
  })();

  return customerProfileInFlight;
}

async function resolveRegionId(): Promise<string> {
  if (AMPEX.REGION_ID) return AMPEX.REGION_ID;
  const data = await fetchStoreJson<{ regions?: { id: string }[] }>('/store/regions');
  const id = data.regions?.[0]?.id;
  if (!id) throw new Error('No Medusa region configured');
  return id;
}

export async function createCart(): Promise<string> {
  const regionId = await resolveRegionId();
  const data = await fetchStoreJson<{ cart?: { id: string }; id?: string }>('/store/carts', {
    method: 'POST',
    body: JSON.stringify({ region_id: regionId, currency_code: AMPEX.CURRENCY_CODE.toLowerCase() }),
  });
  const cartId = data.cart?.id ?? data.id;
  if (!cartId) throw new Error('Failed to create cart');
  setMedusaCartId(cartId);
  return cartId;
}

export type CheckoutLineInput = {
  variantId: string;
  quantity: number;
  unitPriceZar: number;
  eventId: string;
  holderNames: string[];
  ticketName: string;
};

export async function addItemsToCart(cartId: string, items: CheckoutLineInput[]): Promise<void> {
  const payload = {
    items: items.map((i) => ({
      variant_id: i.variantId,
      quantity: i.quantity,
      unit_price: Math.round(i.unitPriceZar * 100),
      metadata: {
        type: 'EVENT',
        event_id: i.eventId,
        holder_names: i.holderNames,
        ticket_type: i.ticketName,
      },
    })),
  };
  const res = await fetchStore(`/store/carts/${cartId}/add-items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { message?: string }).message || 'Failed to add items') as Error & {
      code?: string;
      outOfStock?: unknown;
    };
    err.code = (data as { code?: string }).code;
    err.outOfStock = (data as { out_of_stock_items?: unknown }).out_of_stock_items;
    throw err;
  }
}

export async function startPaystackCheckout(
  cartId: string,
  email: string,
): Promise<{ paymentUrl: string; reference?: string }> {
  const coll = await fetchStoreJson<{ payment_collection?: { id: string }; id?: string }>(
    '/store/payment-collections',
    {
      method: 'POST',
      body: JSON.stringify({ cart_id: cartId }),
    },
  );
  const collectionId = coll.payment_collection?.id ?? coll.id;
  if (!collectionId) throw new Error('Failed to create payment collection');
  sessionStorage.setItem(PAYMENT_COLLECTION_KEY, collectionId);

  const session = await fetchStoreJson<{
    payment_session?: { id?: string; provider_id?: string; data?: Record<string, unknown> };
    payment_sessions?: { id?: string; provider_id?: string; data?: Record<string, unknown> }[];
    payment_collection?: {
      payment_sessions?: { id?: string; provider_id?: string; data?: Record<string, unknown> }[];
    };
  }>(`/store/payment-collections/${collectionId}/payment-sessions`, {
    method: 'POST',
    body: JSON.stringify({
      provider_id: 'pp_paystack',
      data: {
        email,
        cart_id: cartId,
        callback_url: `${window.location.origin}${TICKETS_PAYMENT_CALLBACK}`,
      },
    }),
  });
  if (import.meta.env.DEV) {
    console.debug('[Paystack debug] payment-sessions response shape', {
      has_payment_session: !!session.payment_session,
      payment_sessions_count: session.payment_sessions?.length ?? 0,
      has_payment_collection: !!session.payment_collection,
      nested_payment_sessions_count: session.payment_collection?.payment_sessions?.length ?? 0,
      raw_session_response: session,
    });
  }

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
  const pickString = (...values: unknown[]): string =>
    values.find((v) => typeof v === 'string' && v.trim().length > 0) as string || '';

  const sessions = [
    ...(session.payment_session ? [session.payment_session] : []),
    ...(session.payment_sessions ?? []),
    ...(session.payment_collection?.payment_sessions ?? []),
  ];
  const paystackSession =
    sessions.find((s) => s.provider_id === 'pp_paystack' || s.provider_id === 'paystack') ??
    sessions[0];

  const sessionData = isRecord(paystackSession?.data) ? paystackSession.data : {};
  const nestedData = isRecord(sessionData.data) ? sessionData.data : {};
  const paymentUrl = pickString(
    sessionData.paystackTxAuthorizationUrl,
    nestedData.paystackTxAuthorizationUrl,
    sessionData.authorization_url,
    nestedData.authorization_url,
    sessionData.authorizationUrl,
    nestedData.authorizationUrl,
    sessionData.paystack_authorization_url,
    nestedData.paystack_authorization_url,
    sessionData.url,
    nestedData.url,
  );
  const sessionId = String(paystackSession?.id ?? '');
  if (sessionId) sessionStorage.setItem(PAYMENT_SESSION_KEY, sessionId);

  const reference = pickString(
    sessionData.reference,
    nestedData.reference,
    sessionData.paystackTxRef,
    nestedData.paystackTxRef,
    sessionData.paystackReference,
    nestedData.paystackReference,
    sessionData.tx_ref,
    nestedData.tx_ref,
  );
  if (reference) sessionStorage.setItem('payment_reference', reference);

  if (!paymentUrl) throw new Error('Paystack payment URL not returned');
  return { paymentUrl, reference };
}

export async function finalizePaystackPayment(
  cartId: string,
  reference: string,
): Promise<{ orderId: string }> {
  const sessionId = sessionStorage.getItem(PAYMENT_SESSION_KEY);
  const data = await fetchStoreJson<{
    order_id?: string;
    order?: { id: string };
    success?: boolean;
  }>(`/store/carts/${cartId}/finalize-paystack`, {
    method: 'POST',
    body: JSON.stringify({
      reference,
      ...(sessionId ? { session_id: sessionId } : {}),
    }),
  });
  const orderId = data.order_id ?? data.order?.id;
  if (!orderId) throw new Error('Order was not created');
  clearPaymentState();
  return { orderId };
}

export type UserTicketView = {
  id: string;
  ticketCode: string;
  holderName: string;
  ticketType: string;
  status: string;
  eventTitle: string;
  eventDate: string;
  editionLabel: string;
  orderReference: string;
};

const MY_TICKETS_CACHE_MS = 15_000;

let myTicketsCache: {
  key: string;
  data: UserTicketView[];
  fetchedAt: number;
} | null = null;
let myTicketsInFlight: Promise<UserTicketView[]> | null = null;

export function invalidateMyTicketsCache(): void {
  myTicketsCache = null;
}

function mapMyTicketsResponse(
  tickets: Record<string, unknown>[] | undefined,
): UserTicketView[] {
  return (tickets ?? []).map((t) => {
    const event = (t.event ?? {}) as Record<string, unknown>;
    return {
      id: String(t.id ?? ''),
      ticketCode: String(t.ticket_code ?? t.ticketCode ?? t.id ?? ''),
      holderName: String(t.holder_name ?? t.holderName ?? 'Guest'),
      ticketType: String(t.ticket_type ?? t.ticketType ?? 'Ticket'),
      status: String(t.status ?? 'active'),
      eventTitle: String(event.title ?? event.name ?? 'Event'),
      eventDate: String(event.event_date ?? event.date ?? ''),
      editionLabel: String(event.subtitle ?? event.category ?? ''),
      orderReference: String(t.order_id ?? t.reference ?? t.id ?? ''),
    };
  });
}

export async function getMyTickets(eventId?: string): Promise<UserTicketView[]> {
  const cacheKey = eventId ?? '';
  const now = Date.now();
  if (
    myTicketsCache &&
    myTicketsCache.key === cacheKey &&
    now - myTicketsCache.fetchedAt < MY_TICKETS_CACHE_MS
  ) {
    return myTicketsCache.data;
  }

  if (myTicketsInFlight) {
    return myTicketsInFlight;
  }

  myTicketsInFlight = (async () => {
    try {
      const params = new URLSearchParams();
      if (eventId) params.set('event_id', eventId);
      const qs = params.toString();
      const data = await fetchStoreJson<{
        tickets?: Record<string, unknown>[];
      }>(`/store/tickets/my-tickets${qs ? `?${qs}` : ''}`);
      const mapped = mapMyTicketsResponse(data.tickets);
      myTicketsCache = { key: cacheKey, data: mapped, fetchedAt: Date.now() };
      return mapped;
    } finally {
      myTicketsInFlight = null;
    }
  })();

  return myTicketsInFlight;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadTicketReceipt(
  ticketId: string,
  filename?: string,
): Promise<void> {
  const res = await fetchStore(`/store/tickets/${encodeURIComponent(ticketId)}/receipt`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || 'Failed to download ticket PDF');
  }
  const blob = await res.blob();
  triggerBrowserDownload(blob, filename || `ticket-${ticketId}.pdf`);
}

export async function downloadTicketReceipts(
  tickets: Pick<UserTicketView, 'id' | 'ticketCode' | 'holderName'>[],
): Promise<void> {
  if (tickets.length === 0) {
    throw new Error('No tickets to download');
  }

  for (const ticket of tickets) {
    const safeCode = ticket.ticketCode.replace(/[^\w.-]+/g, '_');
    const safeHolder = ticket.holderName.replace(/[^\w.-]+/g, '_');
    await downloadTicketReceipt(
      ticket.id,
      `ticket-${safeCode || ticket.id}${safeHolder ? `-${safeHolder}` : ''}.pdf`,
    );
  }
}
