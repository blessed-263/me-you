/**
 * Unified data access — mock when VITE_USE_MOCK_DATA=true, AmpEx API otherwise.
 */

import { AMPEX } from './ampexConfig.ts';
import { getLiveEditions, type EventEdition } from './eventEditions.ts';
import { MOCK_EVENT, type MockEvent } from './mockTickets.ts';
import {
  getDashboardStats as mockDashboardStats,
  getMockRevenue as mockRevenue,
  getOrganizerAttendees as mockAttendees,
  getOrganizerOrders as mockOrders,
  markMockOrganizerOrderComplete,
  getOrganizerTickets as mockTickets,
} from './mockOrganizer.ts';
import type {
  MockAttendee,
  MockDashboardStats,
  MockOrganizerOrder,
  MockOrganizerTicket,
  MockRevenue,
  OrganizerOrderStatus,
} from './mockOrganizer.ts';
import * as storeApi from './storeApi.ts';
import * as organizerApi from './organizerApi.ts';
import type { DashboardPeriod } from './organizerListUtils.ts';
import type { ApiTicketType } from './eventMappers.ts';
import type { UserTicketView } from './storeApi.ts';
import { getAttendeeOrders } from './attendeeTickets.ts';

export const useMockData = AMPEX.USE_MOCK_DATA;

export async function fetchPublicEvents(): Promise<MockEvent[]> {
  if (useMockData) return [MOCK_EVENT];
  return storeApi.listOrganizerPublicEvents();
}

export async function fetchEventById(eventId: string): Promise<MockEvent | null> {
  if (useMockData) return eventId === MOCK_EVENT.id ? MOCK_EVENT : null;
  return storeApi.getEvent(eventId);
}

export async function fetchEventTickets(eventId: string): Promise<ApiTicketType[]> {
  if (useMockData) {
    return MOCK_EVENT.ticketTypes.map((t) => ({
      ...t,
      variantId: t.variantId ?? t.id,
    }));
  }
  return storeApi.getEventTickets(eventId);
}

export async function fetchLiveEditions(): Promise<EventEdition[]> {
  if (useMockData) return getLiveEditions();
  const events = await storeApi.listOrganizerPublicEvents();
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    editionLabel: e.subtitle,
    date: e.date,
    venue: e.venue.split(',')[0] ?? e.venue,
    status: e.publicStatus === 'ended' ? ('ended' as const) : ('live' as const),
  }));
}

export async function fetchOrganizerEditions(): Promise<EventEdition[]> {
  if (useMockData) return getLiveEditions();
  return organizerApi.listOrganizerEvents();
}

export async function fetchDashboardStats(
  eventId: string,
  period: DashboardPeriod = '6months',
): Promise<MockDashboardStats> {
  if (useMockData) return mockDashboardStats(eventId);
  return organizerApi.getOrganizerDashboard(eventId, period);
}

export async function fetchOrganizerOrders(eventId?: string): Promise<MockOrganizerOrder[]> {
  if (useMockData) return mockOrders(eventId);
  return organizerApi.getOrganizerOrders(eventId);
}

export async function markOrganizerOrderComplete(orderId: string): Promise<OrganizerOrderStatus> {
  if (useMockData) return markMockOrganizerOrderComplete(orderId);
  return organizerApi.markOrganizerOrderComplete(orderId);
}

export async function fetchOrganizerTickets(eventId?: string): Promise<MockOrganizerTicket[]> {
  if (useMockData) return mockTickets(eventId);
  return organizerApi.getOrganizerTicketsList(eventId);
}

export async function fetchOrganizerAttendees(eventId?: string): Promise<MockAttendee[]> {
  if (useMockData) return mockAttendees(eventId);
  return organizerApi.getOrganizerAttendeesList(eventId);
}

export async function fetchOrganizerRevenue(eventId: string): Promise<MockRevenue> {
  if (useMockData) return mockRevenue(eventId);
  return organizerApi.getOrganizerRevenue(eventId);
}

export async function fetchAttendeeTickets(email: string): Promise<UserTicketView[]> {
  if (useMockData) {
    return getAttendeeOrders(email).flatMap((v) =>
      v.tickets.map((t) => ({
        id: t.id,
        holderName: t.holderName,
        ticketType: t.ticketType,
        status: t.status,
        eventTitle: v.eventTitle,
        eventDate: v.eventDateLabel,
        editionLabel: v.editionLabel,
        orderReference: t.reference,
      })),
    );
  }
  return storeApi.getMyTickets();
}
