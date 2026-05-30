/**
 * Build a local HTML preview of the Harvest Table guest email.
 * Usage: npm run email:preview:harvest-table
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { harvestTableGuestEmail } from '../emails/harvest-table.content.js';
import { renderGuestBroadcastEmail } from '../server/emailTemplates.js';

const previewName = process.argv[2]?.trim() || 'Blessed';
const html = renderGuestBroadcastEmail(
  {
    ...harvestTableGuestEmail,
    heroImageUrl: './public/images/email-hero-harvest-table.png',
  },
  previewName,
);
const outFile = 'harvest-table-email-preview.html';

writeFileSync(outFile, html, 'utf8');
console.log(`Wrote ${outFile} (preview as "${previewName}")`);
console.log(`Subject: ${harvestTableGuestEmail.subject}`);
