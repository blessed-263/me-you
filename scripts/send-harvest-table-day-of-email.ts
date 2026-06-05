/**
 * Send the Harvest Table day-of email via Resend (test to RSVP_NOTIFY_EMAIL).
 * Usage: npm run email:send-test:harvest-table-day-of
 */
import 'dotenv/config';
import { Resend } from 'resend';
import { harvestTableDayOfEmail } from '../emails/harvest-table-day-of.content.js';
import { buildGuestEmailSend } from '../server/guestEmailSend.js';

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
const { html, text, attachments, replyTo } = buildGuestEmailSend(
  harvestTableDayOfEmail,
);

const { data, error } = await resend.emails.send({
  from,
  to,
  replyTo,
  subject: harvestTableDayOfEmail.subject,
  html,
  text,
  attachments: attachments.length > 0 ? attachments : undefined,
});

if (error) {
  console.error('Send failed:', error);
  process.exit(1);
}

console.log('Harvest Table day-of email sent.');
console.log('  Subject:', harvestTableDayOfEmail.subject);
console.log('  To:', to);
console.log('  Reply-To:', replyTo);
console.log('  Id:', data?.id);
