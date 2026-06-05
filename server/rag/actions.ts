/** Action hints returned to the client — execution happens in the browser */

export type AssistantActionPayload =
  | { type: 'navigate'; href: string; label: string }
  | { type: 'add_to_cart'; ticketId: string; ticketName: string; quantity: number };

const TICKETS = [
  { id: 'tt_full_day', name: 'Full Day Pass', patterns: [/full\s*day/i] },
  { id: 'tt_harvest_table', name: 'Harvest Table Experience', patterns: [/harvest/i, /long\s*table/i] },
  { id: 'tt_after_lunch', name: 'After Lunch Gathering', patterns: [/after\s*lunch/i] },
];

function parseQty(q: string): number {
  const m = q.match(/\b(\d+)\b/);
  return m ? Math.max(1, Math.min(10, parseInt(m[1], 10))) : 1;
}

function matchTicket(q: string): (typeof TICKETS)[0] | null {
  for (const t of TICKETS) {
    if (t.patterns.some((p) => p.test(q))) return t;
  }
  return null;
}

export function detectActions(message: string): AssistantActionPayload[] {
  const q = message.trim().toLowerCase();
  const actions: AssistantActionPayload[] = [];

  if (/\b(add|put)\b/.test(q) && (/\bcart\b/.test(q) || matchTicket(q))) {
    const t = matchTicket(q);
    if (t) {
      actions.push({
        type: 'add_to_cart',
        ticketId: t.id,
        ticketName: t.name,
        quantity: parseQty(q),
      });
    }
  }

  if (/\b(my\s+tickets?|show\s+my\s+tickets?|view\s+my\s+tickets?|get\s+my\s+tickets?)\b/.test(q)) {
    actions.push({ type: 'navigate', href: '/tickets/my-tickets', label: 'Open My tickets' });
  }

  if (/\b(sign\s*in|log\s*in)\b/.test(q)) {
    actions.push({ type: 'navigate', href: '/tickets/login?return=%2Ftickets%2Fpick', label: 'Sign in' });
  }

  if (/\b(buy|purchase|book|get)\b/.test(q) && /\btickets?\b/.test(q)) {
    actions.push({ type: 'navigate', href: '/tickets/pick', label: 'Get tickets' });
  }

  if (/\b(checkout|view\s+cart|my\s+cart)\b/.test(q)) {
    actions.push({ type: 'navigate', href: '/tickets/pick', label: 'View cart' });
  }

  if (/\b(directions?|venue|where\s+is)\b/.test(q)) {
    actions.push({
      type: 'navigate',
      href: 'https://www.google.com/maps/dir/?api=1&destination=15%20Fredman%20Drive%2C%20Sandown%2C%20Sandton',
      label: 'Directions',
    });
  }

  return actions;
}
