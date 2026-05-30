import {
  EMAIL_HERO_HARVEST_DISPLAY,
  GUEST_EMAIL_HERO_IMAGES,
  type GuestBroadcastContent,
} from '../server/emailTemplates.js';
import { VENUE_MAPS_URL } from '../server/venue.js';

/**
 * Harvest Table pre-event guest email.
 * Preview: npm run email:preview:harvest-table
 * Test send: npm run email:send-test:harvest-table
 */
export const harvestTableGuestEmail: GuestBroadcastContent = {
  subject: 'A few things before Sunday.',

  preheader:
    'Harvest Table — arrival 11:00–11:30, Nela\'s Kitchen, Primedia Rooftop.',

  eyebrow: 'Harvest Table',

  headline: 'A few things before Sunday.',

  heroImageUrl: GUEST_EMAIL_HERO_IMAGES.harvestTableAlt,
  heroImageAlt: 'Harvest Table — YOU & ME',
  heroDisplayWidth: EMAIL_HERO_HARVEST_DISPLAY.width,
  heroDisplayHeight: EMAIL_HERO_HARVEST_DISPLAY.height,

  centered: true,

  body: `Hi, {{name}},

We've been thinking a lot about this table.

About slowing things down for a few hours.
Good food.
Beautiful people.
Conversations that move naturally from one glass to the next.

Nela's Kitchen has prepared a menu inspired by Africa Month — rich, layered flavours paired with Martell cocktails and soft music carrying us through the afternoon.

With a live screening from Tebogo Malope's latest film, Studying Under the Barrel of a Gun — quietly woven into the experience.

We're really looking forward to having you at the table.`,

  highlight: {
    title: 'A few things to know before Sunday',
    details: [
      {
        label: 'Time',
        value: '11:00am – 11:30am arrival strictly',
      },
      {
        label: 'Date',
        value: '31 May 2026',
      },
      {
        label: 'Location',
        value: 'Primedia Rooftop, 15 Fredman Drive, Sandown, Sandton',
      },
      {
        label: 'Dress code',
        value: 'DENIM',
      },
      {
        label: 'Parking',
        value:
          'Secure basement & open parking available. Access on 24 Central Parking on the corner of Gwen Lane & Fredman Drive. Venue is wheelchair accessible.',
      },
      {
        label: 'Need assistance?',
        value: 'WhatsApp Tumi: +27 71 103 0844',
      },
    ],
  },

  cta: {
    label: 'Get directions',
    href: VENUE_MAPS_URL,
  },

  secondaryCta: {
    label: 'WhatsApp Tumi',
    href: 'https://wa.me/27711030844',
  },

  signoffName: 'YOU & ME',
};
