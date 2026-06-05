import { AMPEX, fetchStoreJson, getOrganizerToken, setOrganizerToken } from './ampexConfig.ts';
import { prepareTicketMixRows, sortMonthlySales, type DashboardPeriod } from './organizerListUtils.ts';
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

export async function organizerLogin(
  email: string,
  password: string,
): Promise<{ token: string; email: string; name: string }> {
  const data = await fetchStoreJson<{
    access_token?: string;
    token?: string;
    user?: { email?: string; first_name?: string; last_name?: string };
  }>('/store/organizers/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const token = data.access_token ?? data.token ?? '';
  if (!token) throw new Error('No organizer token returned');
  setOrganizerToken(token);
  const name = [data.user?.first_name, data.user?.last_name].filter(Boolean).join(' ') || 'Organizer';
  return { token, email: data.user?.email ?? email, name };
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
    monthlySales: sortMonthlySales(
      (data.revenue_by_month ?? []).map((m) => ({
        month: m.month,
        amount: m.revenue,
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

export async function getOrganizerTicketsList(eventId?: string): Promise<MockOrganizerTicket[]> {
  const params = new URLSearchParams();
  if (eventId) params.set('event_id', eventId);
  const qs = params.toString();
  const data = await fetchStoreJson<{ tickets?: Record<string, unknown>[] }>(
    `/store/organizers/tickets${qs ? `?${qs}` : ''}`,
  );
  return (data.tickets ?? []).map((t) => ({
    id: String(t.id ?? ''),
    eventId: String(t.event_id ?? eventId ?? ''),
    orderId: String(t.order_id ?? ''),
    ticketType: String(t.ticket_type ?? 'Ticket'),
    holderName: String(t.holder_name ?? 'Guest'),
    status: (String(t.status ?? 'active') as MockOrganizerTicket['status']) || 'active',
    reference: String(t.order_id ?? t.id ?? ''),
    issuedAt: String(t.created_at ?? new Date().toISOString()),
  }));
}

export async function getOrganizerAttendeesList(eventId?: string): Promise<MockAttendee[]> {
  const params = new URLSearchParams();
  if (eventId) params.set('event_id', eventId);
  const qs = params.toString();
  const data = await fetchStoreJson<{ attendees?: Record<string, unknown>[] }>(
    `/store/organizers/attendees${qs ? `?${qs}` : ''}`,
  );
  return (data.attendees ?? []).map((a, i) => ({
    id: String(a.id ?? `att_${i}`),
    eventId: String(a.event_id ?? eventId ?? ''),
    name: String(a.name ?? a.holder_name ?? 'Guest'),
    email: String(a.email ?? ''),
    phone: String(a.phone ?? ''),
    ticketType: String(a.ticket_type ?? 'Ticket'),
    orderReference: String(a.order_id ?? a.order_reference ?? ''),
    checkedIn: Boolean(a.checked_in ?? a.status === 'used'),
  }));
}

export async function getOrganizerRevenue(eventId?: string, period = '6months'): Promise<MockRevenue> {
  const params = new URLSearchParams({ period });
  if (eventId) params.set('event_id', eventId);
  const data = await fetchStoreJson<{
    gross_revenue?: number;
    platform_fee_percent?: number;
    platform_fee?: number;
    net_revenue?: number;
    by_ticket_type?: { name: string; revenue: number; sold: number }[];
    by_month?: { month: string; revenue: number }[];
  }>(`/store/organizers/revenue?${params}`);

  const gross = data.gross_revenue ?? 0;
  const feePct = data.platform_fee_percent ?? 4.5;
  const fee = data.platform_fee ?? Math.round(gross * (feePct / 100));
  return {
    grossRevenue: gross,
    platformFeePercent: feePct,
    platformFee: fee,
    netRevenue: data.net_revenue ?? gross - fee,
    byTicketType: (data.by_ticket_type ?? []).map((t) => ({
      name: t.name,
      revenue: t.revenue,
      sold: t.sold,
    })),
    byMonth: (data.by_month ?? []).map((m) => ({ month: m.month, revenue: m.revenue })),
  };
}

export function organizerManageEventsUrl(): string {
  return `${AMPEX.AMPEX_FRONTEND_URL}/organizer/events`;
}

export function isOrganizerAuthenticated(): boolean {
  return Boolean(getOrganizerToken());
}
