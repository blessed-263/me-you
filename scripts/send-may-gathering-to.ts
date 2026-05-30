/**
 * Send the May gathering eve-of-event letter.
 * Usage: npx tsx scripts/send-may-gathering-to.ts email1 [email2 ...]
 */
import 'dotenv/config';
import { Resend } from 'resend';
import { mayGatheringTomorrowEmail } from '../emails/may-gathering-tomorrow.content.js';
import { preparePersonalLetterEmailSend } from '../server/guestEmailSend.js';

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
  console.error('Usage: npx tsx scripts/send-may-gathering-to.ts email1 [email2 ...]');
  process.exit(1);
}

const resend = new Resend(apiKey);
const replyTo =
  process.env.MAY_GATHERING_REPLY_TO?.trim() || 'tshepo@tshepojeans.co';
const { html, text, attachments } = preparePersonalLetterEmailSend(
  mayGatheringTomorrowEmail,
);

for (const to of recipients) {
  const { data, error } = await resend.emails.send({
    from,
    to,
    replyTo,
    subject: mayGatheringTomorrowEmail.subject,
    text,
    ...(html ? { html } : {}),
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  if (error) {
    console.error(`Failed → ${to}:`, error);
    process.exit(1);
  }

  console.log(`Sent May gathering → ${to} (${data?.id})`);
  await new Promise((r) => setTimeout(r, 650));
}

console.log('Done.');
