import 'dotenv/config';
import { Resend } from 'resend';
import { renderRsvpConfirmationEmail } from '../server/emailTemplates.js';
import { rsvpConfirmationSubject } from '../server/rsvpSessions.js';

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM_EMAIL?.trim();
const to =
  process.env.RSVP_TEST_EMAIL?.trim() ||
  process.env.RSVP_NOTIFY_EMAIL?.trim();

const sessionId =
  process.env.RSVP_TEST_SESSION === 'after-party-lunch'
    ? 'after-party-lunch'
    : 'harvest-table';

if (!apiKey) {
  console.error('Missing RESEND_API_KEY in .env');
  process.exit(1);
}
if (!from) {
  console.error('Missing RESEND_FROM_EMAIL in .env');
  process.exit(1);
}
if (!to) {
  console.error('Set RSVP_TEST_EMAIL or RSVP_NOTIFY_EMAIL in .env');
  process.exit(1);
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from,
  to,
  subject: `${rsvpConfirmationSubject(sessionId)} (test)`,
  html: renderRsvpConfirmationEmail('Guest Name', sessionId),
});

if (error) {
  console.error('Send failed:', error);
  process.exit(1);
}

console.log('Test email sent.');
console.log('  Session:', sessionId);
console.log('  From:', from);
console.log('  To:', to);
console.log('  Id:', data?.id);
