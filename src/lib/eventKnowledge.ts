/** Client-side knowledge mirror for offline assistant fallback */

export type KnowledgeChunk = {
  id: string;
  title: string;
  text: string;
  tags: string[];
};

export const EVENT_KNOWLEDGE: KnowledgeChunk[] = [
  {
    id: 'overview',
    title: 'You & Me — The Gathering',
    tags: ['event', 'about', 'gathering'],
    text: `You & Me — The Gathering is a cultural event: music, food, conversation, and community. Second edition: Harvest Table dining flows into an after-lunch sonic experience.`,
  },
  {
    id: 'date-time',
    title: 'Date and time',
    tags: ['when', 'date', 'time'],
    text: `Sunday 31 May 2026, from 11:00 AM to late. Harvest Table ~11:00–14:30; After Lunch ~15:00–20:00.`,
  },
  {
    id: 'venue',
    title: 'Venue',
    tags: ['where', 'venue', 'sandton'],
    text: `Primedia Rooftop, 15 Fredman Drive, Sandown, Sandton, 2196. Martell bar and rooftop at Primedia Sandton.`,
  },
  {
    id: 'ticket-harvest',
    title: 'Harvest Table Experience',
    tags: ['ticket', 'harvest', '1850'],
    text: `Harvest Table Experience: R 1,850. Meal, welcome drinks, entry to after gathering. 11:00–14:30.`,
  },
  {
    id: 'ticket-after',
    title: 'After Lunch Gathering',
    tags: ['ticket', 'after', '650'],
    text: `After Lunch Gathering: R 650. Music and room from ~15:00–20:00.`,
  },
  {
    id: 'ticket-full',
    title: 'Full Day Pass',
    tags: ['ticket', 'full day', '2200'],
    text: `Full Day Pass: R 2,200. Harvest Table plus After Lunch.`,
  },
  {
    id: 'purchase',
    title: 'How to buy',
    tags: ['buy', 'sign in'],
    text: `Sign in on the ticket page, choose experiences, checkout. Sign-in required to purchase.`,
  },
  {
    id: 'my-tickets',
    title: 'My tickets',
    tags: ['my tickets'],
    text: `After purchase, open My tickets while signed in with the same email.`,
  },
];

export const ASSISTANT_SUGGESTED = [
  'Add a Full Day Pass to my cart',
  'Where is the venue and how do I get there?',
  'Show my tickets',
  'What is included in Harvest Table?',
] as const;
