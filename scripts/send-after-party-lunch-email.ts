/**
 * Send the After Lunch Party guest email via Resend.
 * Usage: npm run email:send-test:after-party-lunch
 */
import 'dotenv/config';
import { Resend } from 'resend';
import { afterPartyLunchGuestEmail } from '../emails/after-party-lunch.content.js';
import { prepareGuestEmailSend } from '../server/guestEmailSend.js';
import {
  closeDbPool,
  lookupRsvpNamesByEmail,
  resolveGuestFirstName,
  sanitizeGuestDisplayName,
} from '../server/guestEmailNames.js';

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM_EMAIL?.trim();
const to = process.env.RSVP_NOTIFY_EMAIL?.trim();

if (!apiKey) {
  console.error('Missing RESEND_API_KEY in .env');
  process.exit(1);
}
if (!from) {
  console.error('Missing RESEND_FROM_EMAIL in .env');
  process.exit(1);
}
if (!to) {
  console.error('Set RSVP_NOTIFY_EMAIL in .env');
  process.exit(1);
}

const resend = new Resend(apiKey);
const rsvpNames = await lookupRsvpNamesByEmail([to]);
const guestName = sanitizeGuestDisplayName(
  resolveGuestFirstName(to, rsvpNames.get(to.toLowerCase())),
);

try {
  const { html, attachments } = prepareGuestEmailSend(
    afterPartyLunchGuestEmail,
    guestName,
  );

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: afterPartyLunchGuestEmail.subject,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  if (error) {
    console.error('Send failed:', error);
    process.exit(1);
  }

  console.log('After Lunch Party guest email sent.');
  console.log('  Subject:', afterPartyLunchGuestEmail.subject);
  console.log('  From:', from);
  console.log('  To:', to);
  console.log('  Name:', guestName);
  console.log('  Inline hero:', attachments.length > 0 ? 'yes' : 'no');
  console.log('  Id:', data?.id);
} finally {
  await closeDbPool();
}
