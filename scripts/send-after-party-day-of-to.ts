/**
 * Send the After Lunch Party day-of email to one or more addresses.
 * Usage: npx tsx scripts/send-after-party-day-of-to.ts email1 [email2 ...]
 */
import 'dotenv/config';
import { Resend } from 'resend';
import { afterPartyDayOfEmail } from '../emails/after-party-day-of.content.js';
import { buildGuestEmailSend } from '../server/guestEmailSend.js';

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM_EMAIL?.trim();
const recipients = process.argv
  .slice(2)
  .map((e) => e.trim().toLowerCase())
  .filter((e) => e.includes('@'));

if (!apiKey) {
  console.error('Missing RESEND_API_KEY in .env');
  process.exit(1);
}
if (!from) {
  console.error('Missing RESEND_FROM_EMAIL in .env');
  process.exit(1);
}
if (recipients.length === 0) {
  console.error(
    'Usage: npx tsx scripts/send-after-party-day-of-to.ts email1 [email2 ...]',
  );
  process.exit(1);
}

const resend = new Resend(apiKey);
const { html, text, attachments, replyTo } = buildGuestEmailSend(
  afterPartyDayOfEmail,
);

for (const to of recipients) {
  const { data, error } = await resend.emails.send({
    from,
    to,
    replyTo,
    subject: afterPartyDayOfEmail.subject,
    html,
    text,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  if (error) {
    console.error(`Failed → ${to}:`, error);
    process.exit(1);
  }

  console.log(`Sent After Lunch Party day-of → ${to} (${data?.id})`);
  await new Promise((r) => setTimeout(r, 650));
}

console.log('Done.');
