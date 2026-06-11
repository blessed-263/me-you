/**
 * Ticket flow routes (nested under /tickets/* and /event/*).
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AttendeeSessionGate from './components/AttendeeSessionGate.tsx';
import MyTicketsPage from './tickets/MyTicketsPage.tsx';
import TicketIntroStep from './tickets/TicketIntroStep.tsx';
import TicketPickStep from './tickets/TicketPickStep.tsx';
import CheckoutStep from './tickets/CheckoutStep.tsx';
import PaymentStep from './tickets/PaymentStep.tsx';
import PaymentCallbackStep from './tickets/PaymentCallbackStep.tsx';
import SuccessStep from './tickets/SuccessStep.tsx';

function SuccessRoute() {
  const location = useLocation();
  const allowPublicSuccess = Boolean(
    new URLSearchParams(location.search).get('reference'),
  );

  if (allowPublicSuccess) {
    return <SuccessStep />;
  }

  return (
    <AttendeeSessionGate>
      <SuccessStep />
    </AttendeeSessionGate>
  );
}

export default function TicketPage() {
  return (
    <Routes>
      <Route index element={<TicketIntroStep />} />
      <Route
        path="pick"
        element={
          <AttendeeSessionGate>
            <TicketPickStep />
          </AttendeeSessionGate>
        }
      />
      <Route
        path="checkout"
        element={
          <AttendeeSessionGate>
            <CheckoutStep />
          </AttendeeSessionGate>
        }
      />
      <Route
        path="payment"
        element={
          <AttendeeSessionGate>
            <PaymentStep />
          </AttendeeSessionGate>
        }
      />
      <Route path="payment/callback" element={<PaymentCallbackStep />} />
      <Route path="success" element={<SuccessRoute />} />
      <Route
        path="my-tickets"
        element={
          <AttendeeSessionGate>
            <MyTicketsPage />
          </AttendeeSessionGate>
        }
      />
      <Route path="*" element={<TicketIntroStep />} />
    </Routes>
  );
}
