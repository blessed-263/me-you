/** Curated knowledge chunks for retrieval — keep in sync with storefront copy */

export type KnowledgeChunk = {
  id: string;
  title: string;
  text: string;
  tags: string[];
};

export const KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  {
    id: 'overview',
    title: 'You & Me — The Gathering',
    tags: ['event', 'about', 'gathering', 'culture', 'music', 'food'],
    text: `You & Me — The Gathering is a cultural event centered on music, food, conversation, and community. The second edition flows from curated long-table dining (Harvest Table by Nela's Kitchen) into an after-lunch sonic experience as the day moves into evening. Category: Culture & Music.`,
  },
  {
    id: 'date-time',
    title: 'Date and time',
    tags: ['when', 'date', 'time', 'schedule', 'hours'],
    text: `The main gathering (second edition) is on Sunday 31 May 2026. Doors and the experience run from 11:00 AM to late. Harvest Table is roughly 11:00–14:30; After Lunch Gathering from about 15:00–20:00. Times may shift slightly on the day — arrive on time for your ticket type.`,
  },
  {
    id: 'venue',
    title: 'Venue and directions',
    tags: ['where', 'venue', 'location', 'address', 'sandton', 'maps', 'parking'],
    text: `Venue: Primedia Rooftop, 15 Fredman Drive, Sandown, Sandton, 2196. The setting includes the Martell bar and rooftop at the Primedia Sandton campus. Use the Directions link on the ticket page for Google Maps. Paid parking is typically available at Sandton campuses — allow extra time for arrival and security.`,
  },
  {
    id: 'ticket-harvest',
    title: 'Harvest Table Experience',
    tags: ['ticket', 'harvest', 'dining', 'lunch', 'price', '1850'],
    text: `Harvest Table Experience (Part I): R 1,850. Includes curated meal and welcome drinks from 11:00–14:30, plus entry to the after gathering. Names on tickets must match ID at the door.`,
  },
  {
    id: 'ticket-after',
    title: 'After Lunch Gathering',
    tags: ['ticket', 'after', 'music', 'afternoon', 'price', '650'],
    text: `After Lunch Gathering (Part II): R 650. Sonic experience from about 15:00–20:00 as the room shifts into evening. Does not include the Harvest Table meal unless you hold a Full Day Pass or Harvest Table ticket.`,
  },
  {
    id: 'ticket-full',
    title: 'Full Day Pass',
    tags: ['ticket', 'full day', 'bundle', 'price', '2200'],
    text: `Full Day Pass: R 2,200. Covers Harvest Table and After Lunch in one seamless journey from midday to evening. Best value if you want the full You & Me day.`,
  },
  {
    id: 'purchase',
    title: 'How to buy tickets',
    tags: ['buy', 'purchase', 'checkout', 'pay', 'sign in', 'account'],
    text: `To purchase: visit the ticket page, sign in (or create an account on the sign-in screen — demo accepts any password), choose your experiences, enter guest names, and complete mock checkout. You must be signed in to add tickets to cart and pay. Payment is simulated in preview mode.`,
  },
  {
    id: 'my-tickets',
    title: 'My tickets',
    tags: ['my tickets', 'download', 'email', 'account', 'access'],
    text: `After purchase while signed in, your tickets appear under My tickets (/tickets/my-tickets). Use the same email you signed in with. In production, PDF tickets and confirmation emails would be sent; preview shows order references and guest names.`,
  },
  {
    id: 'editions-live',
    title: 'Event editions',
    tags: ['edition', 'series', 'multiple', 'live', 'rooftop'],
    text: `You & Me runs in editions. Live editions currently include: (1) You & Me — The Gathering, second edition, 31 May 2026; (2) You & Me — Rooftop Sessions pop-up, 28 June 2026. Organisers only see live editions in the dashboard. Past and draft editions are hidden until they go live.`,
  },
  {
    id: 'rooftop-popup',
    title: 'Rooftop Sessions pop-up',
    tags: ['rooftop', 'june', 'popup', 'sessions'],
    text: `You & Me — Rooftop Sessions is a June 2026 pop-up at Primedia Rooftop. Rooftop Session tickets are R 950 per person in the demo storefront. Check the ticket page for the active edition you are booking.`,
  },
  {
    id: 'door-policy',
    title: 'At the door',
    tags: ['id', 'name', 'check in', 'guest', 'holder'],
    text: `Each ticket is issued to a named guest. Names entered at checkout must match photo ID shown at the door. Group bookings can assign different names per ticket when not using "same name for all".`,
  },
  {
    id: 'organizer',
    title: 'Organisers',
    tags: ['organizer', 'dashboard', 'host', 'sell'],
    text: `Event organisers use the Organizer workspace (/organizer/login) for orders, tickets sold, attendees, and revenue. That area is separate from guest ticket purchase and requires organiser sign-in.`,
  },
  {
    id: 'refunds',
    title: 'Refunds and changes',
    tags: ['refund', 'cancel', 'change', 'policy'],
    text: `Refund and transfer policies for each edition are set by the organiser. In preview/demo mode, some sample orders show pending or refunded status for testing only. Contact the You & Me team for real-world refund requests once live sales are open.`,
  },
  {
    id: 'support',
    title: 'Help and contact',
    tags: ['help', 'contact', 'support', 'question', 'email'],
    text: `For questions not answered here, reach the You & Me Africa team through the main site contact channels or your confirmation email once live. This assistant only answers from published event details.`,
  },
];
