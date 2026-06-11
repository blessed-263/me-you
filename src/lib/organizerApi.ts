import { AMPEX, fetchStoreJson } from './ampexConfig.ts';
import { normalizeMonthlySales, prepareTicketMixRows, type DashboardPeriod } from './organizerListUtils.ts';
import { mapBackendEventToEdition, zarFromCents } from './eventMappers.ts';
import type { EventEdition } from './eventEditions.ts';
import type {
  MockAttendee,
  MockDashboardStats,
  MockOrganizerOrder,
  MockOrganizerTicket,
  MockRevenue,
  OrganizerOrderStatus,
} from './mockOrganizer.ts';

export async function getOrganizerProfile(): Promise<{
  email: string;
  name: string;
} | null> {
  try {
    const data = await fetchStoreJson<{
      profile?: {
        email?: string;
        first_name?: string;
        last_name?: string;
        company_name?: string;
      };
    }>('/store/organizers/profile');
    const profile = data.profile;
    if (!profile?.email) return null;
    const name =
      profile.company_name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
      'Organizer';
    return { email: profile.email, name };
  } catch {
    return null;
  }
}

export async function organizerLogin(
  email: string,
  password: string,
): Promise<{ email: string; name: string }> {
  const data = await fetchStoreJson<{
    user?: { email?: string; first_name?: string; last_name?: string };
  }>('/store/organizers/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  if (!data.user?.email) {
    throw new Error('Organizer login failed');
  }
  const name = [data.user.first_name, data.user.last_name].filter(Boolean).join(' ') || 'Organizer';
  return { email: data.user.email, name };
}

export async function listOrganizerEvents(): Promise<EventEdition[]> {
  const data = await fetchStoreJson<{ events?: Record<string, unknown>[] }>(
    '/store/organizers/events',
  );
  return (data.events ?? [])
    .map((e) => mapBackendEventToEdition(e))
    .filter((e) => e.status === 'live' || e.status === 'draft' || e.status === 'ended');
}

export async function getOrganizerDashboard(
  eventId?: string,
  period: DashboardPeriod = '6months',
): Promise<MockDashboardStats> {
  const params = new URLSearchParams({ period });
  if (eventId) params.set('event_id', eventId);
  const data = await fetchStoreJson<{
    stats?: Record<string, number>;
    revenue_by_month?: { month: string; revenue: number }[];
    ticket_type_distribution?: { name: string; count: number; revenue?: number }[];
  }>(`/store/organizers/dashboard?${params}`);

  const stats = data.stats ?? {};
  const ticketsSold = stats.total_tickets_sold ?? 0;
  const used = stats.total_tickets_used ?? 0;
  const active = stats.total_tickets_active ?? 0;
  const checkInRate = ticketsSold > 0 ? Math.round((used / ticketsSold) * 100) : 0;

  return {
    revenueTotal: stats.total_revenue ?? 0,
    ticketsSold,
    ticketsActive: active,
    ticketsUsed: used,
    checkInRate,
    monthlySales: normalizeMonthlySales(
      (data.revenue_by_month ?? []).map((m) => ({
        month: String(m.month ?? '').trim(),
        amount: typeof m.revenue === 'number' ? m.revenue : 0,
      })),
    ),
    ticketTypeDistribution: prepareTicketMixRows(
      (data.ticket_type_distribution ?? []).map((t) => ({
        name: t.name,
        count: t.count,
      })),
    ).map((row) => ({ name: row.label, count: row.value })),
  };
}

function mapOrderStatus(display: string): OrganizerOrderStatus {
  if (display === 'completed') return 'completed';
  if (display === 'refunded') return 'refunded';
  return 'pending';
}

export async function markOrganizerOrderComplete(orderId: string): Promise<OrganizerOrderStatus> {
  const data = await fetchStoreJson<{ display_status?: string }>(
    `/store/organizers/orders/${encodeURIComponent(orderId)}/complete`,
    { method: 'POST' },
  );
  return mapOrderStatus(String(data.display_status ?? 'completed'));
}

export async function getOrganizerOrders(eventId?: string): Promise<MockOrganizerOrder[]> {
  const params = new URLSearchParams();
  if (eventId) params.set('event_id', eventId);
  const qs = params.toString();
  const data = await fetchStoreJson<{ orders?: Record<string, unknown>[] }>(
    `/store/organizers/orders${qs ? `?${qs}` : ''}`,
  );
  return (data.orders ?? []).map((o) => {
    const items = (o.items as Record<string, unknown>[] | undefined) ?? [];
    const holderNames = (o.holder_names as string[] | undefined) ?? [];
    const totalCents = typeof o.total === 'number' ? o.total : 0;
    return {
      id: String(o.id ?? ''),
      eventId:
        eventId ??
        String((items[0]?.metadata as Record<string, unknown> | undefined)?.event_id ?? ''),
      reference: String(o.display_id ?? o.id ?? ''),
      paidAt: String(o.paid_at ?? o.created_at ?? ''),
      buyerName: holderNames[0] ?? String(o.email ?? 'Guest'),
      buyerEmail: String(o.email ?? ''),
      buyerPhone: String((o.shipping_address as Record<string, unknown> | undefined)?.phone ?? ''),
      total: zarFromCents(totalCents),
      items: items.map((item) => ({
        ticketId: String(item.variant_id ?? item.id ?? ''),
        ticketName: String(item.title ?? item.product_title ?? 'Ticket'),
        quantity: Number(item.quantity ?? 1),
        unitPrice: zarFromCents(Number(item.unit_price ?? 0)),
      })),
      holderNames: holderNames.length > 0 ? holderNames : ['Guest'],
      status: mapOrderStatus(String(o.display_status ?? o.status ?? 'pending')),
    };
  });
}

function mapOrganizerTicketStatus(status: string): MockOrganizerTicket['status'] {
  if (status === 'used') return 'used';
  if (status === 'voided' || status === 'cancelled') return 'cancelled';
  return 'active';
}

function mapOrganizerTicket(
  raw: Record<string, unknown>,
  fallbackEventId?: string,
): MockOrganizerTicket {
  const event = raw.event as Record<string, unknown> | null | undefined;
  const order = raw.order as Record<string, unknown> | null | undefined;

  return {
    id: String(raw.id ?? raw.ticket_id ?? ''),
    eventId: String(event?.id ?? raw.event_id ?? fallbackEventId ?? ''),
    orderId: String(raw.order_id ?? order?.id ?? ''),
    ticketType: String(raw.ticket_type ?? 'Ticket'),
    holderName: String(raw.holder_name ?? 'Guest'),
    status: mapOrganizerTicketStatus(String(raw.status ?? 'active')),
    reference: String(raw.ticket_code ?? raw.qr_code ?? raw.order_id ?? raw.id ?? ''),
    issuedAt: String(raw.created_at ?? order?.created_at ?? new Date().toISOString()),
  };
}

export async function getOrganizerTicketsList(eventId?: string): Promise<MockOrganizerTicket[]> {
  const pageSize = 100;
  let offset = 0;
  const all: MockOrganizerTicket[] = [];

  while (true) {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
    });
    if (eventId) params.set('event_id', eventId);

    const data = await fetchStoreJson<{ tickets?: Record<string, unknown>[]; count?: number }>(
      `/store/organizers/tickets?${params}`,
    );
    const batch = (data.tickets ?? []).map((raw) => mapOrganizerTicket(raw, eventId));
    all.push(...batch);

    const total = data.count ?? all.length;
    offset += batch.length;
    if (batch.length === 0 || offset >= total) break;
  }

  return all;
}

export async function getOrganizerAttendeesList(eventId?: string): Promise<MockAttendee[]> {
  const params = new URLSearchParams();
  if (eventId) params.set('event_id', eventId);
  const qs = params.toString();
  const data = await fetchStoreJson<{ attendees?: Record<string, unknown>[] }>(
    `/store/organizers/attendees${qs ? `?${qs}` : ''}`,
  );
  return (data.attendees ?? []).map((raw, i) => {
    const customer = raw.customer as Record<string, unknown> | null | undefined;
    const event = raw.event as Record<string, unknown> | null | undefined;
    const customerName = [customer?.first_name, customer?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    const status = String(raw.status ?? '');

    return {
      id: String(raw.ticket_id ?? raw.id ?? `att_${i}`),
      eventId: String(event?.id ?? raw.event_id ?? eventId ?? ''),
      name: String(raw.holder_name ?? (customerName || raw.name) ?? 'Guest'),
      email: String(customer?.email ?? raw.email ?? ''),
      phone: String(customer?.phone ?? raw.phone ?? ''),
      ticketType: String(raw.ticket_type ?? 'Ticket'),
      orderReference: String(
        raw.ticket_code ?? raw.qr_code ?? raw.order_id ?? raw.order_reference ?? '',
      ),
      checkedIn: status === 'used' || Boolean(raw.checked_in ?? raw.validated_at),
    };
  });
}

export async function getOrganizerRevenue(
  eventId?: string,
  period: DashboardPeriod | 'all' = 'all',
): Promise<MockRevenue> {
  const params = new URLSearchParams({ period });
  if (eventId) params.set('event_id', eventId);
  const data = await fetchStoreJson<{
    summary?: {
      total_revenue?: number;
      platform_fee?: number;
      organizer_earnings?: number;
      commission_rate?: number;
    };
    gross_revenue?: number;
    platform_fee_percent?: number;
    platform_fee?: number;
    net_revenue?: number;
    by_ticket_type?: { name: string; revenue: number; sold: number }[];
    by_month?: { month: string; revenue: number }[];
  }>(`/store/organizers/revenue?${params}`);

  const summary = data.summary ?? {};
  const gross = summary.total_revenue ?? data.gross_revenue ?? 0;
  const feePct = summary.commission_rate ?? data.platform_fee_percent ?? 4.5;
  const fee = summary.platform_fee ?? data.platform_fee ?? Math.round(gross * (feePct / 100));
  const net = summary.organizer_earnings ?? data.net_revenue ?? gross - fee;

  const monthlyRows = normalizeMonthlySales(
    (data.by_month ?? []).map((m) => ({
      month: String(m.month ?? '').trim(),
      amount: typeof m.revenue === 'number' ? m.revenue : 0,
    })),
  );

  return {
    grossRevenue: gross,
    platformFeePercent: feePct,
    platformFee: fee,
    netRevenue: net,
    byTicketType: (data.by_ticket_type ?? [])
      .map((t) => ({
        name: String(t.name ?? 'Ticket'),
        revenue: typeof t.revenue === 'number' ? t.revenue : 0,
        sold: typeof t.sold === 'number' ? t.sold : 0,
      }))
      .filter((t) => t.revenue > 0 || t.sold > 0)
      .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name)),
    byMonth: monthlyRows.map(({ month, amount }) => ({ month, revenue: amount })),
  };
}

export function organizerManageEventsUrl(): string {
  if (!AMPEX.AMPEX_FRONTEND_URL) return '';
  return `${AMPEX.AMPEX_FRONTEND_URL}/organizer/events`;
}

export function isOrganizerAuthenticated(): boolean {
  try {
    return Boolean(sessionStorage.getItem('yme_organizer_session'));
  } catch {
    return false;
  }
}
