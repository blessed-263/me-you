/**
 * Build a local HTML preview of the After Lunch Party day-of email.
 * Usage: npm run email:preview:after-party-day-of
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { afterPartyDayOfEmail } from '../emails/after-party-day-of.content.js';
import { renderGuestBroadcastEmail } from '../server/emailTemplates.js';

const html = renderGuestBroadcastEmail({
  ...afterPartyDayOfEmail,
  heroImageUrl: './public/sponsors/youandme brown .png',
});
const outFile = 'email-preview.html';

writeFileSync(outFile, html, 'utf8');
console.log(`Wrote ${outFile}`);
console.log(`Subject: ${afterPartyDayOfEmail.subject}`);
