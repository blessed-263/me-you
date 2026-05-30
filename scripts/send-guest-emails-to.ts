/**
 * Send both guest emails to one or more addresses.
 * Usage: npx tsx scripts/send-guest-emails-to.ts you@example.com [email|Name ...]
 */
import 'dotenv/config';
import { Resend } from 'resend';
import { afterPartyLunchGuestEmail } from '../emails/after-party-lunch.content.js';
import { harvestTableGuestEmail } from '../emails/harvest-table.content.js';
import { prepareGuestEmailSend } from '../server/guestEmailSend.js';
import {
  closeDbPool,
  lookupRsvpNamesByEmail,
  resolveGuestFirstName,
  sanitizeGuestDisplayName,
} from '../server/guestEmailNames.js';

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM_EMAIL?.trim();
const rawArgs = process.argv.slice(2).map((e) => e.trim()).filter(Boolean);

function parseRecipient(arg: string): { email: string; name?: string } {
  const [email, name] = arg.split(/[:|]/, 2).map((part) => part.trim());
  if (!email.includes('@')) {
    console.error(`Invalid recipient "${arg}". Use email or email|Panashe`);
    process.exit(1);
  }
  return { email, name: name || undefined };
}

const recipients = rawArgs.map(parseRecipient);

if (!apiKey) {
  console.error('Missing RESEND_API_KEY in .env');
  process.exit(1);
}
if (!from) {
  console.error('Missing RESEND_FROM_EMAIL in .env');
  process.exit(1);
}
if (recipients.length === 0) {
  console.error('Usage: npx tsx scripts/send-guest-emails-to.ts email1 [email2 ...]');
  process.exit(1);
}

const resend = new Resend(apiKey);
const emails = [
  { label: 'Harvest Table', content: harvestTableGuestEmail },
  { label: 'After Lunch Party', content: afterPartyLunchGuestEmail },
];

const rsvpNames = await lookupRsvpNamesByEmail(
  recipients.map((recipient) => recipient.email),
);

try {
  for (const { email: to, name: nameOverride } of recipients) {
    const guestName = sanitizeGuestDisplayName(
      nameOverride ??
        resolveGuestFirstName(to, rsvpNames.get(to.toLowerCase())),
    );

    for (const { label, content } of emails) {
      const { html, attachments } = prepareGuestEmailSend(content, guestName);

      const { data, error } = await resend.emails.send({
        from,
        to,
        subject: content.subject,
        html,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (error) {
        console.error(`Failed (${label} → ${to}):`, error);
        process.exit(1);
      }

      console.log(`Sent ${label} → ${to} as "${guestName}" (${data?.id})`);
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log('Done.');
} finally {
  await closeDbPool();
}
