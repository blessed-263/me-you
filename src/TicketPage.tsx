/**
 * Routes ticket flows by pathname.
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { loadAttendeeSession, ticketsLoginUrl } from './lib/attendeeAuth.ts';
import {
  TICKETS_BASE,
  TICKETS_CHECKOUT,
  TICKETS_MY,
  TICKETS_PAYMENT,
  TICKETS_PAYMENT_CALLBACK,
  TICKETS_PICK,
  TICKETS_PROTECTED_PATHS,
  TICKETS_SUCCESS,
} from './lib/mockCheckout.ts';
import MyTicketsPage from './tickets/MyTicketsPage.tsx';
import TicketIntroStep from './tickets/TicketIntroStep.tsx';
import TicketPickStep from './tickets/TicketPickStep.tsx';
import CheckoutStep from './tickets/CheckoutStep.tsx';
import PaymentStep from './tickets/PaymentStep.tsx';
import PaymentCallbackStep from './tickets/PaymentCallbackStep.tsx';
import SuccessStep from './tickets/SuccessStep.tsx';

const PROTECTED = new Set<string>(TICKETS_PROTECTED_PATHS);

export default function TicketPage() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  if (path === TICKETS_MY) {
    if (!loadAttendeeSession()) {
      window.location.replace(ticketsLoginUrl(TICKETS_MY));
      return null;
    }
    return <MyTicketsPage />;
  }

  if (PROTECTED.has(path) && !loadAttendeeSession()) {
    window.location.replace(ticketsLoginUrl(path));
    return null;
  }

  if (path === TICKETS_CHECKOUT) return <CheckoutStep />;
  if (path === TICKETS_PAYMENT) return <PaymentStep />;
  if (path === TICKETS_PAYMENT_CALLBACK) return <PaymentCallbackStep />;
  if (path === TICKETS_SUCCESS) return <SuccessStep />;
  if (path === TICKETS_PICK) return <TicketPickStep />;
  if (path === TICKETS_BASE || path.startsWith('/event/')) return <TicketIntroStep />;

  return <TicketIntroStep />;
}
