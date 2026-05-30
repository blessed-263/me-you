import {
  GUEST_EMAIL_HERO_IMAGES,
  type PersonalLetterContent,
} from '../server/emailTemplates.js';

/**
 * Eve-of-event note to May RSVPs (Harvest Table + After Lunch Party).
 * Preview: npm run email:preview
 */
export const mayGatheringTomorrowEmail: PersonalLetterContent = {
  subject: 'Tomorrow, we gather.',

  heroImageUrl: GUEST_EMAIL_HERO_IMAGES.mayGatheringPoster,
  heroImageAlt: 'YOU & ME — Sunday 31 May',
  heroAfterBody: true,
  personalDelivery: true,
  plainTextOnly: false,

  greeting: 'Dear Friend,',

  body: `Tomorrow, we gather.

A room filled with good people, meaningful conversation and a soundtrack curated for the city we call home.

Thank you for being part of it.

We look forward to welcoming you to YOU & ME AFRICA with Martell.

See you tomorrow.`,

  signoffName: 'Tshepo Mohlala',
  signoffTitle: 'Founder & Curator',
  signoffOrg: 'YOU & ME AFRICA',
};
