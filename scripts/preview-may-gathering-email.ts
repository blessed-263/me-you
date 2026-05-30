/**
 * Build a local HTML preview of the May gathering eve-of-event letter.
 * Usage: npm run email:preview
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { mayGatheringTomorrowEmail } from '../emails/may-gathering-tomorrow.content.js';
import { renderPersonalLetterEmail } from '../server/emailTemplates.js';

const html = renderPersonalLetterEmail({
  ...mayGatheringTomorrowEmail,
  plainTextOnly: false,
  heroImageUrl: './public/images/email-may-gathering-poster.png',
});
const outFile = 'email-preview.html';

writeFileSync(outFile, html, 'utf8');
console.log(`Wrote ${outFile}`);
console.log(`Subject: ${mayGatheringTomorrowEmail.subject}`);
