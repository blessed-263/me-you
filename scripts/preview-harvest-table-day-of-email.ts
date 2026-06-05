/**
 * Build a local HTML preview of the Harvest Table day-of email.
 * Usage: npm run email:preview:harvest-table-day-of
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { harvestTableDayOfEmail } from '../emails/harvest-table-day-of.content.js';
import { renderGuestBroadcastEmail } from '../server/emailTemplates.js';

const html = renderGuestBroadcastEmail({
  ...harvestTableDayOfEmail,
  heroImageUrl: './public/sponsors/youandme brown .png',
});
const outFile = 'email-preview.html';

writeFileSync(outFile, html, 'utf8');
console.log(`Wrote ${outFile}`);
console.log(`Subject: ${harvestTableDayOfEmail.subject}`);
