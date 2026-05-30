import {
  EMAIL_HERO_AFTER_PARTY_DISPLAY,
  GUEST_EMAIL_HERO_IMAGES,
  type GuestBroadcastContent,
} from '../server/emailTemplates.js';
import { VENUE_MAPS_URL } from '../server/venue.js';

/**
 * After Lunch Party pre-event guest email.
 * Preview: npm run email:preview:after-party-lunch
 * Send test: npm run email:send-test:after-party-lunch
 */
export const afterPartyLunchGuestEmail: GuestBroadcastContent = {
  subject: 'And then we dance.',

  preheader:
    'After the table — soulful house, amapiano & Afro tech. 15:00–20:00, Primedia Rooftop.',

  eyebrow: 'The After Lunch Party',

  headline: 'And then we dance.',

  heroImageUrl: GUEST_EMAIL_HERO_IMAGES.guestShared,
  heroImageAlt: 'YOU & ME',
  heroDisplayWidth: EMAIL_HERO_AFTER_PARTY_DISPLAY.width,
  heroDisplayHeight: EMAIL_HERO_AFTER_PARTY_DISPLAY.height,

  centered: true,
  showSponsors: false,

  body: `Hi, {{name}},

After the table, we let the music take over.

THE GATHERING

No pressure.
No performance.
Just that feeling when the right song comes on and suddenly everyone feels connected again.

SiR LSG & DJ Souldiva
Lee Art
Ms Printz
Cornelius SA
Angeke Babuye MC
Lastborn Diroba.

Slow builds & beautiful transitions.
The kind of sound that makes people linger a little longer.

We're looking forward to sharing the afternoon with you.`,

  highlight: {
    title: 'A few things to know before Sunday',
    details: [
      {
        label: 'Time',
        value: '15:00pm – 20:00pm',
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
        value: 'Tumi: +27 71 103 0844',
      },
    ],
  },

  cta: {
    label: 'Get directions',
    href: VENUE_MAPS_URL,
  },

  signoffName: 'YOU & ME',
};
