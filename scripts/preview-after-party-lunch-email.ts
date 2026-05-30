/**
 * Build a local HTML preview of the After Lunch Party guest email.
 * Usage: npm run email:preview:after-party-lunch
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { afterPartyLunchGuestEmail } from '../emails/after-party-lunch.content.js';
import { renderGuestBroadcastEmail } from '../server/emailTemplates.js';

const previewName = process.argv[2]?.trim() || 'Blessed';
const html = renderGuestBroadcastEmail(
  {
    ...afterPartyLunchGuestEmail,
    heroImageUrl: './public/images/email-hero-youandme.png',
  },
  previewName,
);
const outFile = 'after-party-lunch-email-preview.html';

writeFileSync(outFile, html, 'utf8');
console.log(`Wrote ${outFile} (preview as "${previewName}")`);
console.log(`Subject: ${afterPartyLunchGuestEmail.subject}`);
