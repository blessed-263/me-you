import {
  GUEST_EMAIL_HERO_IMAGES,
  type GuestBroadcastContent,
} from '../server/emailTemplates.js';
import { VENUE_MAPS_URL } from '../server/venue.js';

/**
 * Harvest Table day-of guest email.
 * Preview: npm run email:preview:harvest-table-day-of
 * Test send: npm run email:send-test:harvest-table-day-of
 */
export const harvestTableDayOfEmail: GuestBroadcastContent = {
  subject: 'The table is set.',

  eyebrow: 'Harvest Table',

  headline: 'HEY YOU,',

  heroStyle: 'logo',
  heroImageUrl: GUEST_EMAIL_HERO_IMAGES.youandmeBrownLogo,
  heroImageAlt: 'YOU & ME',

  centered: true,
  showSponsors: false,
  personalDelivery: true,

  body: `By now, the table is set.

The glasses polished.
The music chosen.
The conversations waiting to happen.

Today, we gather for an afternoon of beautiful food, meaningful connection, and a celebration of Africa Month curated through flavour, music, and storytelling.

Nela's Kitchen will be serving a harvest table designed to be savoured slowly, accompanied by Martell cocktails, soft sounds, and a private screening of *Studying Under the Barrel of a Gun* by Tebogo Malope.`,

  highlight: {
    title: 'A final note before we see you',
    details: [
      {
        label: 'Location',
        value: 'Primedia Rooftop\n15 Fredman Drive, Sandown, Sandton',
      },
      {
        label: 'Parking',
        value:
          'Please make use of 15 Fredman Drive, Sandown for entry to the basement parking',
      },
      {
        label: 'Arrival',
        value: '11:00am – 11:30am strictly',
      },
    ],
  },

  bodyAfter: `Everything else, we'll leave for today.

See you at the table.`,

  cta: {
    label: 'Get directions',
    href: VENUE_MAPS_URL,
  },

  signoffName: 'YOU & ME',
};
