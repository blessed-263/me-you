import {
  GUEST_EMAIL_HERO_IMAGES,
  type GuestBroadcastContent,
} from '../server/emailTemplates.js';
import { VENUE_MAPS_URL } from '../server/venue.js';

/**
 * After Lunch Party day-of guest email.
 * Preview: npm run email:preview:after-party-day-of
 * Test send: npm run email:send-test:after-party-day-of
 */
export const afterPartyDayOfEmail: GuestBroadcastContent = {
  subject: 'The rooftop is waiting.',

  eyebrow: 'The After Lunch Party',

  headline: 'HEY YOU,',

  heroStyle: 'logo',
  heroImageUrl: GUEST_EMAIL_HERO_IMAGES.youandmeBrownLogo,
  heroImageAlt: 'YOU & ME',

  centered: true,
  showSponsors: false,
  personalDelivery: true,

  body: `By now, you've probably chosen the denim.

The music is ready.
The rooftop is waiting.
And the city is about to give way to something a little slower.

Today, we gather for an afternoon shaped by soulful house, private school amapiano, and Afro tech.

SiR LSG & DJ SoulDiva
Lee Art
Ms Printz
Cornelius SA
Angeke Babuye
Lastborn Diroba

Slow builds.
Beautiful transitions.
The kind of sound that keeps good people together a little longer.`,

  highlight: {
    title: 'A final note before we see you',
    details: [
      {
        label: 'Time',
        value: '15:00pm – 20:00pm',
      },
      {
        label: 'Location',
        value: 'Primedia Rooftop\n15 Fredman Drive, Sandown, Sandton',
      },
      {
        label: 'Parking',
        value:
          'Please make use of 15 Fredman Drive, Sandown for entry to the basement parking.',
      },
      {
        label: 'Dress code',
        value: 'DENIM',
      },
    ],
  },

  bodyAfter: `Everything else, we'll leave to the music.

See you on the rooftop.`,

  cta: {
    label: 'Get directions',
    href: VENUE_MAPS_URL,
  },

  signoffName: 'YOU & ME',
};
