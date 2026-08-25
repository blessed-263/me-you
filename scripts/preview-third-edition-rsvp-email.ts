/**
 * Build a local HTML preview of the third-edition After Lunch RSVP confirmation.
 * Usage: npx tsx scripts/preview-third-edition-rsvp-email.ts
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { renderThirdEditionRsvpConfirmationEmail } from '../server/emailTemplates.js';

const OUT_DIR = 'email-previews';
mkdirSync(OUT_DIR, { recursive: true });

const html = renderThirdEditionRsvpConfirmationEmail('Blessed Guest');
const outPath = path.join(OUT_DIR, 'third-edition-rsvp.html');
writeFileSync(outPath, html, 'utf8');
console.log(`Wrote ${outPath}`);
