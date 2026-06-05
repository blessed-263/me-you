import { loadAttendeeSession, ticketsLoginUrl, ticketsPickHref } from './attendeeAuth.ts';
import { ASSISTANT_TICKETS, addTicketToCart } from './assistantCart.ts';
import { cartHasItems, loadCart, TICKETS_CHECKOUT, TICKETS_MY, TICKETS_PICK } from './mockCheckout.ts';
import { VENUE_MAPS_URL } from './venue.ts';

export type AssistantAction =
  | { type: 'navigate'; href: string; label: string }
  | { type: 'add_to_cart'; ticketId: string; ticketName: string; quantity: number };

const TICKET_ALIASES: { id: string; patterns: RegExp[] }[] = [
  { id: 'tt_full_day', patterns: [/full\s*day/i, /\bfull\b/i] },
  { id: 'tt_harvest_table', patterns: [/harvest/i, /long\s*table/i, /dining/i, /part\s*i\b/i] },
  { id: 'tt_after_lunch', patterns: [/after\s*lunch/i, /sonic/i, /part\s*ii\b/i] },
];

function parseQuantity(text: string): number {
  const m = text.match(/\b(\d+)\s*(?:x|×|tickets?)?\b/i) || text.match(/(?:add|get|buy)\s+(\d+)/i);
  if (m) return Math.max(1, Math.min(10, parseInt(m[1], 10)));
  return 1;
}

function matchTicketId(text: string): string | null {
  const lower = text.toLowerCase();
  for (const { id, patterns } of TICKET_ALIASES) {
    if (patterns.some((p) => p.test(lower))) return id;
  }
  for (const t of ASSISTANT_TICKETS) {
    if (lower.includes(t.name.toLowerCase())) return t.id;
  }
  return null;
}

export function detectAssistantActions(message: string): AssistantAction[] {
  const q = message.trim().toLowerCase();
  const actions: AssistantAction[] = [];

  const wantsAdd =
    /\b(add|put|include)\b/.test(q) && (/\bcart\b/.test(q) || /\border\b/.test(q) || matchTicketId(q));
  const wantsBuy = /\b(buy|purchase|book|get)\b/.test(q) && /\btickets?\b/.test(q);
  const wantsCart = /\b(cart|checkout)\b/.test(q) && /\b(view|go|open|see|my)\b/.test(q);
  const wantsMyTickets =
    /\b(my\s+tickets?|show\s+my\s+tickets?|view\s+my\s+tickets?|get\s+my\s+tickets?)\b/.test(q);
  const wantsSignIn = /\b(sign\s*in|log\s*in|create\s+account)\b/.test(q);
  const wantsDirections = /\b(directions?|venue|where\s+is|how\s+do\s+i\s+get)\b/.test(q);
  const wantsPick = /\b(choose|select|pick)\b/.test(q) && /\b(tickets?|experiences?)\b/.test(q);

  if (wantsAdd || (/\badd\b/.test(q) && matchTicketId(q))) {
    const ticketId = matchTicketId(q);
    if (ticketId) {
      const ticket = ASSISTANT_TICKETS.find((t) => t.id === ticketId)!;
      actions.push({
        type: 'add_to_cart',
        ticketId,
        ticketName: ticket.name,
        quantity: parseQuantity(q),
      });
    }
  }

  if (wantsMyTickets) {
    const session = loadAttendeeSession();
    actions.push({
      type: 'navigate',
      href: session ? TICKETS_MY : ticketsLoginUrl(TICKETS_MY),
      label: session ? 'Open My tickets' : 'Sign in to view tickets',
    });
  }

  if (wantsSignIn) {
    actions.push({
      type: 'navigate',
      href: ticketsLoginUrl(TICKETS_PICK),
      label: 'Sign in',
    });
  }

  if (wantsCart) {
    const cart = loadCart();
    const href = cart && cartHasItems(cart) ? TICKETS_CHECKOUT : ticketsPickHref();
    actions.push({
      type: 'navigate',
      href,
      label: cart && cartHasItems(cart) ? 'Go to checkout' : 'Choose tickets',
    });
  }

  if (wantsBuy || wantsPick) {
    actions.push({
      type: 'navigate',
      href: ticketsPickHref(),
      label: 'Get tickets',
    });
  }

  if (wantsDirections) {
    actions.push({
      type: 'navigate',
      href: VENUE_MAPS_URL,
      label: 'Open directions',
    });
  }

  return actions;
}

export async function executeAssistantActions(actions: AssistantAction[]): Promise<string[]> {
  const notes: string[] = [];

  for (const action of actions) {
    if (action.type === 'add_to_cart') {
      const result = await addTicketToCart(action.ticketId, action.quantity);
      if (result.ok) {
        notes.push(
          `Added ${action.quantity}× ${action.ticketName} to your cart. Sign in when you're ready to checkout.`,
        );
      } else {
        notes.push('error' in result ? result.error : 'Could not add to cart.');
      }
    }
  }

  return notes;
}

export function actionButtons(actions: AssistantAction[]): AssistantAction[] {
  return actions.filter((a) => a.type === 'navigate');
}
