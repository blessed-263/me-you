import { getEditionById } from './eventEditions.ts';
import { formatEditionDate } from './eventEditions.ts';
import {
  getOrganizerOrders,
  getOrganizerTickets,
  type MockOrganizerOrder,
  type MockOrganizerTicket,
} from './mockOrganizer.ts';

export type AttendeeOrderView = {
  order: MockOrganizerOrder;
  tickets: MockOrganizerTicket[];
  eventTitle: string;
  eventDateLabel: string;
  editionLabel: string;
};

function emailMatches(orderEmail: string, sessionEmail: string): boolean {
  return orderEmail.trim().toLowerCase() === sessionEmail.trim().toLowerCase();
}

export function getAttendeeOrders(email: string): AttendeeOrderView[] {
  const orders = getOrganizerOrders().filter(
    (o) => emailMatches(o.buyerEmail, email) && o.status !== 'refunded',
  );
  const allTickets = getOrganizerTickets();

  return orders.map((order) => {
    const edition = getEditionById(order.eventId);
    const tickets = allTickets.filter((t) => t.orderId === order.id);
    return {
      order,
      tickets,
      eventTitle: edition?.title ?? 'You & Me Africa',
      eventDateLabel: edition ? formatEditionDate(edition.date) : '—',
      editionLabel: edition?.editionLabel ?? '',
    };
  });
}

export function attendeeHasTickets(email: string): boolean {
  return getAttendeeOrders(email).some((v) => v.tickets.length > 0 || v.order.status === 'completed');
}
