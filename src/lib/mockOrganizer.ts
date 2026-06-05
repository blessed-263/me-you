import type { MockOrder } from './mockCheckout.ts';
import { cartSubtotal } from './mockCheckout.ts';
import { MOCK_EVENT } from './mockTickets.ts';
import { DEFAULT_LIVE_EVENT_ID } from './organizerEventScope.ts';

export const ORGANIZER_ROUTES = {
  LOGIN: '/organizer/login',
  DASHBOARD: '/organizer/dashboard',
  ORDERS: '/organizer/orders',
  TICKETS: '/organizer/tickets',
  ATTENDEES: '/organizer/attendees',
  REVENUE: '/organizer/revenue',
} as const;

export type OrganizerOrderStatus = 'completed' | 'pending' | 'refunded';

export type MockOrganizerOrder = {
  id: string;
  eventId: string;
  reference: string;
  paidAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  total: number;
  items: { ticketId: string; ticketName: string; quantity: number; unitPrice: number }[];
  holderNames: string[];
  status: OrganizerOrderStatus;
};

export type MockOrganizerTicket = {
  id: string;
  eventId: string;
  orderId: string;
  ticketType: string;
  holderName: string;
  status: 'active' | 'used' | 'cancelled';
  reference: string;
  issuedAt: string;
};

export type MockAttendee = {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  ticketType: string;
  orderReference: string;
  checkedIn: boolean;
};

export type MockDashboardStats = {
  revenueTotal: number;
  ticketsSold: number;
  ticketsActive: number;
  ticketsUsed: number;
  checkInRate: number;
  monthlySales: { month: string; amount: number }[];
  ticketTypeDistribution: { name: string; count: number }[];
};

export type MockRevenue = {
  grossRevenue: number;
  platformFeePercent: number;
  platformFee: number;
  netRevenue: number;
  byTicketType: { name: string; revenue: number; sold: number }[];
  byMonth: { month: string; revenue: number }[];
};

const EXTRA_ORDERS_KEY = 'yme_organizer_extra_orders';
const ORDER_STATUS_OVERRIDES_KEY = 'yme_organizer_order_status_overrides';

function loadOrderStatusOverrides(): Record<string, OrganizerOrderStatus> {
  try {
    const raw = localStorage.getItem(ORDER_STATUS_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, OrganizerOrderStatus>;
  } catch {
    return {};
  }
}

function saveOrderStatusOverrides(overrides: Record<string, OrganizerOrderStatus>): void {
  localStorage.setItem(ORDER_STATUS_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function markMockOrganizerOrderComplete(orderId: string): OrganizerOrderStatus {
  const overrides = loadOrderStatusOverrides();
  overrides[orderId] = 'completed';
  saveOrderStatusOverrides(overrides);
  return 'completed';
}

function applyOrderStatusOverride(order: MockOrganizerOrder): MockOrganizerOrder {
  const override = loadOrderStatusOverrides()[order.id];
  return override ? { ...order, status: override } : order;
}

const GATHERING_LIVE = MOCK_EVENT.id;
const POPUP_LIVE = '01KQVZ98LIVEPOPUP2026';
const EDITION_2025_ENDED = '01KQVZ98ENDED2025';

const STATIC_ORDERS: MockOrganizerOrder[] = [
  {
    id: 'ord_mock_ym001',
    eventId: GATHERING_LIVE,
    reference: 'YME-MOCK-A1B2C3D4',
    paidAt: '2026-04-12T09:14:00+02:00',
    buyerName: 'Thabo Molefe',
    buyerEmail: 'thabo.m@example.com',
    buyerPhone: '+27 82 555 1201',
    total: 1850,
    items: [{ ticketId: 'tt_harvest_table', ticketName: 'Harvest Table Experience', quantity: 1, unitPrice: 1850 }],
    holderNames: ['Thabo Molefe'],
    status: 'completed',
  },
  {
    id: 'ord_mock_ym002',
    eventId: GATHERING_LIVE,
    reference: 'YME-MOCK-E5F6G7H8',
    paidAt: '2026-04-18T14:32:00+02:00',
    buyerName: 'Zanele Khumalo',
    buyerEmail: 'zanele.k@example.com',
    buyerPhone: '+27 71 444 8890',
    total: 2500,
    items: [
      { ticketId: 'tt_harvest_table', ticketName: 'Harvest Table Experience', quantity: 1, unitPrice: 1850 },
      { ticketId: 'tt_after_lunch', ticketName: 'After Lunch Gathering', quantity: 1, unitPrice: 650 },
    ],
    holderNames: ['Zanele Khumalo', 'Zanele Khumalo'],
    status: 'completed',
  },
  {
    id: 'ord_mock_ym003',
    eventId: GATHERING_LIVE,
    reference: 'YME-MOCK-I9J0K1L2',
    paidAt: '2026-04-22T11:05:00+02:00',
    buyerName: 'James van Wyk',
    buyerEmail: 'james.vw@example.com',
    buyerPhone: '+27 83 221 3344',
    total: 2200,
    items: [{ ticketId: 'tt_full_day', ticketName: 'Full Day Pass', quantity: 1, unitPrice: 2200 }],
    holderNames: ['James van Wyk'],
    status: 'completed',
  },
  {
    id: 'ord_mock_ym004',
    eventId: GATHERING_LIVE,
    reference: 'YME-MOCK-M3N4O5P6',
    paidAt: '2026-05-02T16:48:00+02:00',
    buyerName: 'Amahle Dlamini',
    buyerEmail: 'amahle.d@example.com',
    buyerPhone: '+27 60 998 7712',
    total: 1300,
    items: [{ ticketId: 'tt_after_lunch', ticketName: 'After Lunch Gathering', quantity: 2, unitPrice: 650 }],
    holderNames: ['Amahle Dlamini', 'Sipho Dlamini'],
    status: 'completed',
  },
  {
    id: 'ord_mock_ym005',
    eventId: GATHERING_LIVE,
    reference: 'YME-MOCK-Q7R8S9T0',
    paidAt: '2026-05-08T08:20:00+02:00',
    buyerName: 'Michael Chen',
    buyerEmail: 'm.chen@example.com',
    buyerPhone: '+27 84 112 5566',
    total: 4400,
    items: [{ ticketId: 'tt_full_day', ticketName: 'Full Day Pass', quantity: 2, unitPrice: 2200 }],
    holderNames: ['Michael Chen', 'Lisa Chen'],
    status: 'completed',
  },
  {
    id: 'ord_mock_ym006',
    eventId: GATHERING_LIVE,
    reference: 'YME-MOCK-U1V2W3X4',
    paidAt: '2026-05-14T19:11:00+02:00',
    buyerName: 'Nomsa Ndlovu',
    buyerEmail: 'nomsa.n@example.com',
    buyerPhone: '+27 72 667 9033',
    total: 1850,
    items: [{ ticketId: 'tt_harvest_table', ticketName: 'Harvest Table Experience', quantity: 1, unitPrice: 1850 }],
    holderNames: ['Nomsa Ndlovu'],
    status: 'completed',
  },
  {
    id: 'ord_mock_ym007',
    eventId: GATHERING_LIVE,
    reference: 'YME-MOCK-Y5Z6A7B8',
    paidAt: '2026-05-19T12:44:00+02:00',
    buyerName: 'David Okonkwo',
    buyerEmail: 'david.o@example.com',
    buyerPhone: '+27 78 334 2210',
    total: 650,
    items: [{ ticketId: 'tt_after_lunch', ticketName: 'After Lunch Gathering', quantity: 1, unitPrice: 650 }],
    holderNames: ['David Okonkwo'],
    status: 'completed',
  },
  {
    id: 'ord_mock_ym008',
    eventId: GATHERING_LIVE,
    reference: 'YME-MOCK-C9D0E1F2',
    paidAt: '2026-05-21T10:02:00+02:00',
    buyerName: 'Priya Naidoo',
    buyerEmail: 'priya.n@example.com',
    buyerPhone: '+27 61 445 7788',
    total: 3700,
    items: [
      { ticketId: 'tt_harvest_table', ticketName: 'Harvest Table Experience', quantity: 2, unitPrice: 1850 },
    ],
    holderNames: ['Priya Naidoo', 'Raj Naidoo'],
    status: 'completed',
  },
  {
    id: 'ord_mock_ym009',
    eventId: GATHERING_LIVE,
    reference: 'YME-MOCK-G3H4I5J6',
    paidAt: '2026-05-24T15:30:00+02:00',
    buyerName: 'Lerato Mokoena',
    buyerEmail: 'lerato.m@example.com',
    buyerPhone: '+27 79 556 1200',
    total: 2200,
    items: [{ ticketId: 'tt_full_day', ticketName: 'Full Day Pass', quantity: 1, unitPrice: 2200 }],
    holderNames: ['Lerato Mokoena'],
    status: 'pending',
  },
  {
    id: 'ord_mock_ym010',
    eventId: GATHERING_LIVE,
    reference: 'YME-MOCK-K7L8M9N0',
    paidAt: '2026-05-26T09:55:00+02:00',
    buyerName: 'Chris Botha',
    buyerEmail: 'chris.b@example.com',
    buyerPhone: '+27 82 901 4432',
    total: 1850,
    items: [{ ticketId: 'tt_harvest_table', ticketName: 'Harvest Table Experience', quantity: 1, unitPrice: 1850 }],
    holderNames: ['Chris Botha'],
    status: 'refunded',
  },
  {
    id: 'ord_mock_popup01',
    eventId: POPUP_LIVE,
    reference: 'YME-POPUP-X2Y3Z4',
    paidAt: '2026-06-01T11:20:00+02:00',
    buyerName: 'Aisha Patel',
    buyerEmail: 'aisha.p@example.com',
    buyerPhone: '+27 83 900 1122',
    total: 950,
    items: [{ ticketId: 'tt_rooftop', ticketName: 'Rooftop Session', quantity: 1, unitPrice: 950 }],
    holderNames: ['Aisha Patel'],
    status: 'completed',
  },
  {
    id: 'ord_mock_popup02',
    eventId: POPUP_LIVE,
    reference: 'YME-POPUP-A5B6C7',
    paidAt: '2026-06-10T18:45:00+02:00',
    buyerName: 'Sibusiso Nkosi',
    buyerEmail: 'sibusiso.n@example.com',
    buyerPhone: '+27 72 300 8877',
    total: 1900,
    items: [{ ticketId: 'tt_rooftop', ticketName: 'Rooftop Session', quantity: 2, unitPrice: 950 }],
    holderNames: ['Sibusiso Nkosi', 'Thandi Nkosi'],
    status: 'completed',
  },
  {
    id: 'ord_mock_2025_01',
    eventId: EDITION_2025_ENDED,
    reference: 'YME-2025-LEGACY01',
    paidAt: '2025-10-20T10:00:00+02:00',
    buyerName: 'Legacy Guest',
    buyerEmail: 'legacy@example.com',
    buyerPhone: '+27 11 000 0000',
    total: 1500,
    items: [{ ticketId: 'tt_v1', ticketName: 'First edition pass', quantity: 1, unitPrice: 1500 }],
    holderNames: ['Legacy Guest'],
    status: 'completed',
  },
];

function normalizeOrder(raw: MockOrganizerOrder): MockOrganizerOrder {
  return {
    ...raw,
    eventId: raw.eventId || DEFAULT_LIVE_EVENT_ID,
  };
}

function loadExtraOrders(): MockOrganizerOrder[] {
  try {
    const raw = localStorage.getItem(EXTRA_ORDERS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as MockOrganizerOrder[]).map(normalizeOrder);
  } catch {
    return [];
  }
}

function saveExtraOrders(orders: MockOrganizerOrder[]): void {
  localStorage.setItem(EXTRA_ORDERS_KEY, JSON.stringify(orders));
}

export function getOrganizerOrders(eventId?: string): MockOrganizerOrder[] {
  const extra = loadExtraOrders();
  const seen = new Set<string>();
  const merged: MockOrganizerOrder[] = [];
  for (const o of [...extra, ...STATIC_ORDERS.map(normalizeOrder)]) {
    if (seen.has(o.id)) continue;
    seen.add(o.id);
    merged.push(applyOrderStatusOverride(o));
  }
  const sorted = merged.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  if (!eventId) return sorted;
  return sorted.filter((o) => o.eventId === eventId);
}

export function appendMockOrder(order: MockOrder): void {
  const total = cartSubtotal(order.cart);
  const buyerName = `${order.buyer.firstName} ${order.buyer.lastName}`.trim();
  const mapped: MockOrganizerOrder = {
    id: order.orderId,
    eventId: order.cart.eventId || DEFAULT_LIVE_EVENT_ID,
    reference: order.reference,
    paidAt: order.paidAt,
    buyerName,
    buyerEmail: order.buyer.email,
    buyerPhone: order.buyer.phone,
    total,
    items: order.cart.items.map((i) => ({
      ticketId: i.ticketId,
      ticketName: i.ticketName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    holderNames: order.buyer.holderNames,
    status: 'completed',
  };
  const extra = loadExtraOrders().filter((o) => o.id !== mapped.id);
  extra.unshift(mapped);
  saveExtraOrders(extra);
}

function buildTicketsFromOrders(orders: MockOrganizerOrder[]): MockOrganizerTicket[] {
  const tickets: MockOrganizerTicket[] = [];
  let seq = 1;
  for (const order of orders) {
    if (order.status !== 'completed') continue;
    order.holderNames.forEach((holderName, idx) => {
      const line = order.items[Math.min(idx, order.items.length - 1)];
      const used = seq % 5 === 0;
      tickets.push({
        id: `tkt_mock_${String(seq).padStart(4, '0')}`,
        eventId: order.eventId,
        orderId: order.id,
        ticketType: line?.ticketName ?? 'Ticket',
        holderName,
        status: used ? 'used' : 'active',
        reference: order.reference,
        issuedAt: order.paidAt,
      });
      seq += 1;
    });
  }
  return tickets;
}

const STATIC_TICKETS_EXTRA: MockOrganizerTicket[] = [
  {
    id: 'tkt_mock_9001',
    eventId: GATHERING_LIVE,
    orderId: 'ord_mock_ym001',
    ticketType: 'Harvest Table Experience',
    holderName: 'Thabo Molefe',
    status: 'used',
    reference: 'YME-MOCK-A1B2C3D4',
    issuedAt: '2026-04-12T09:14:00+02:00',
  },
  {
    id: 'tkt_mock_9002',
    eventId: GATHERING_LIVE,
    orderId: 'ord_mock_ym004',
    ticketType: 'After Lunch Gathering',
    holderName: 'Amahle Dlamini',
    status: 'cancelled',
    reference: 'YME-MOCK-M3N4O5P6',
    issuedAt: '2026-05-02T16:48:00+02:00',
  },
];

export function getOrganizerTickets(eventId?: string): MockOrganizerTicket[] {
  const orders = getOrganizerOrders(eventId);
  const fromOrders = buildTicketsFromOrders(eventId ? orders : getOrganizerOrders());
  const seen = new Set(fromOrders.map((t) => t.id));
  for (const t of STATIC_TICKETS_EXTRA) {
    if (eventId && t.eventId !== eventId) continue;
    if (!seen.has(t.id)) fromOrders.push(t);
  }
  const sorted = fromOrders.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  if (!eventId) return sorted;
  return sorted.filter((t) => t.eventId === eventId);
}

export function getOrganizerAttendees(eventId?: string): MockAttendee[] {
  const tickets = getOrganizerTickets(eventId);
  const orders = getOrganizerOrders(eventId);
  return tickets
    .filter((t) => t.status !== 'cancelled')
    .map((t, i) => {
      const order = orders.find((o) => o.id === t.orderId);
      return {
        id: `att_${t.eventId}_${i + 1}`,
        eventId: t.eventId,
        name: t.holderName,
        email: order?.buyerEmail ?? 'guest@example.com',
        phone: order?.buyerPhone ?? '',
        ticketType: t.ticketType,
        orderReference: t.reference,
        checkedIn: t.status === 'used',
      };
    });
}

function computeStats(eventId: string): MockDashboardStats {
  const orders = getOrganizerOrders(eventId);
  const completed = orders.filter((o) => o.status === 'completed');
  const revenueTotal = completed.reduce((s, o) => s + o.total, 0);
  const tickets = getOrganizerTickets(eventId);
  const active = tickets.filter((t) => t.status === 'active').length;
  const used = tickets.filter((t) => t.status === 'used').length;
  const ticketsSold = tickets.filter((t) => t.status !== 'cancelled').length;
  const checkInRate = ticketsSold > 0 ? Math.round((used / ticketsSold) * 100) : 0;

  const typeCounts: Record<string, number> = {};
  for (const t of tickets) {
    if (t.status === 'cancelled') continue;
    typeCounts[t.ticketType] = (typeCounts[t.ticketType] ?? 0) + 1;
  }

  const byMonth: Record<string, number> = {};
  for (const o of completed) {
    const d = new Date(o.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = (byMonth[key] ?? 0) + o.total;
  }
  const monthlySales = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  return {
    revenueTotal,
    ticketsSold,
    ticketsActive: active,
    ticketsUsed: used,
    checkInRate,
    monthlySales: monthlySales.length > 0 ? monthlySales : [{ month: '—', amount: 0 }],
    ticketTypeDistribution: Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

export function getDashboardStats(eventId: string): MockDashboardStats {
  return computeStats(eventId);
}

export function getMockRevenue(eventId: string): MockRevenue {
  const orders = getOrganizerOrders(eventId).filter((o) => o.status === 'completed');
  const grossRevenue = orders.reduce((s, o) => s + o.total, 0);
  const platformFeePercent = 4.5;
  const platformFee = Math.round(grossRevenue * (platformFeePercent / 100));
  const byType: Record<string, { revenue: number; sold: number }> = {};
  for (const o of orders) {
    for (const item of o.items) {
      const key = item.ticketName;
      if (!byType[key]) byType[key] = { revenue: 0, sold: 0 };
      byType[key].revenue += item.unitPrice * item.quantity;
      byType[key].sold += item.quantity;
    }
  }

  const byMonthMap: Record<string, number> = {};
  for (const o of orders) {
    const label = new Date(o.paidAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    byMonthMap[label] = (byMonthMap[label] ?? 0) + o.total;
  }

  return {
    grossRevenue,
    platformFeePercent,
    platformFee,
    netRevenue: grossRevenue - platformFee,
    byTicketType: Object.entries(byType).map(([name, v]) => ({
      name,
      revenue: v.revenue,
      sold: v.sold,
    })),
    byMonth: Object.entries(byMonthMap).map(([month, revenue]) => ({ month, revenue })),
  };
}

/** @deprecated Use selected edition from OrganizerEventContext */
export const MOCK_EVENT_NAME = MOCK_EVENT.title;
