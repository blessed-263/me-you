import { downloadCsv, downloadJson } from './organizerExport.ts';
import type {
  MockAttendee,
  MockDashboardStats,
  MockOrganizerOrder,
  MockOrganizerTicket,
  MockRevenue,
} from './mockOrganizer.ts';
import { formatPrice } from './mockTickets.ts';

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportOrdersCsv(orders: MockOrganizerOrder[]): void {
  downloadCsv(
    [
      ['Reference', 'Buyer', 'Email', 'Phone', 'Total (ZAR)', 'Status', 'Paid at', 'Line items', 'Guests'],
      ...orders.map((o) => [
        o.reference,
        o.buyerName,
        o.buyerEmail,
        o.buyerPhone,
        o.total,
        o.status,
        o.paidAt,
        o.items.map((i) => `${i.ticketName} x${i.quantity}`).join('; '),
        o.holderNames.join('; '),
      ]),
    ],
    `you-and-me-orders-${stamp()}.csv`,
  );
}

export function exportOrdersJson(orders: MockOrganizerOrder[]): void {
  downloadJson(orders, `you-and-me-orders-${stamp()}.json`);
}

export function exportTicketsCsv(tickets: MockOrganizerTicket[]): void {
  downloadCsv(
    [
      ['Ticket ID', 'Holder', 'Type', 'Order reference', 'Status', 'Issued at'],
      ...tickets.map((t) => [t.id, t.holderName, t.ticketType, t.reference, t.status, t.issuedAt]),
    ],
    `you-and-me-tickets-${stamp()}.csv`,
  );
}

export function exportTicketsJson(tickets: MockOrganizerTicket[]): void {
  downloadJson(tickets, `you-and-me-tickets-${stamp()}.json`);
}

export function exportAttendeesCsv(rows: MockAttendee[]): void {
  downloadCsv(
    [
      ['Name', 'Email', 'Phone', 'Ticket type', 'Order reference', 'Checked in'],
      ...rows.map((r) => [r.name, r.email, r.phone, r.ticketType, r.orderReference, r.checkedIn ? 'Yes' : 'No']),
    ],
    `you-and-me-attendees-${stamp()}.csv`,
  );
}

export function exportAttendeesJson(rows: MockAttendee[]): void {
  downloadJson(rows, `you-and-me-attendees-${stamp()}.json`);
}

export function exportRevenueCsv(revenue: MockRevenue): void {
  downloadCsv(
    [
      ['Section', 'Label', 'Amount (ZAR)', 'Sold'],
      ['Summary', 'Gross', revenue.grossRevenue, ''],
      ['Summary', `Platform fee (${revenue.platformFeePercent}%)`, revenue.platformFee, ''],
      ['Summary', 'Net', revenue.netRevenue, ''],
      ...revenue.byTicketType.map((r) => ['By ticket type', r.name, r.revenue, r.sold]),
      ...revenue.byMonth.map((r) => ['By month', r.month, r.revenue, '']),
    ],
    `you-and-me-revenue-${stamp()}.csv`,
  );
}

export function exportRevenueJson(revenue: MockRevenue): void {
  downloadJson(revenue, `you-and-me-revenue-${stamp()}.json`);
}

export function exportDashboardCsv(stats: MockDashboardStats): void {
  downloadCsv(
    [
      ['Metric', 'Value'],
      ['Revenue (ZAR)', stats.revenueTotal],
      ['Tickets sold', stats.ticketsSold],
      ['Active tickets', stats.ticketsActive],
      ['Used tickets', stats.ticketsUsed],
      ['Check-in rate (%)', stats.checkInRate],
      ...stats.monthlySales.map((m) => [`Sales ${m.month}`, m.amount]),
      ...stats.ticketTypeDistribution.map((t) => [`Tickets: ${t.name}`, t.count]),
    ],
    `you-and-me-dashboard-${stamp()}.csv`,
  );
}

export function exportDashboardMonthlyCsv(stats: MockDashboardStats): void {
  downloadCsv(
    [['Month', 'Sales (ZAR)'], ...stats.monthlySales.map((m) => [m.month, m.amount])],
    `you-and-me-sales-by-month-${stamp()}.csv`,
  );
}

export function formatZar(n: number): string {
  return `R ${formatPrice(n)}`;
}
