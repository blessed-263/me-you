/**
 * Bulk-send the May gathering letter to all May RSVPs (deduped by email).
 * Usage: npx tsx scripts/send-may-gathering-all.ts
 */
import 'dotenv/config';
import { Resend } from 'resend';
import { mayGatheringTomorrowEmail } from '../emails/may-gathering-tomorrow.content.js';
import { getPool, logDatabaseConfig } from '../server/db.js';
import { preparePersonalLetterEmailSend } from '../server/guestEmailSend.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM_EMAIL?.trim();

if (!apiKey) {
  console.error('Missing RESEND_API_KEY in .env');
  process.exit(1);
}
if (!from) {
  console.error('Missing RESEND_FROM_EMAIL in .env');
  process.exit(1);
}

logDatabaseConfig();

const pool = getPool();
if (!pool) {
  console.error('Set DATABASE_URL in .env');
  process.exit(1);
}

const resend = new Resend(apiKey);
const replyTo =
  process.env.MAY_GATHERING_REPLY_TO?.trim() || 'tshepo@tshepojeans.co';

const { html, text, attachments } = preparePersonalLetterEmailSend(
  mayGatheringTomorrowEmail,
);

let sent = 0;
let failed = 0;
const failures: { email: string; error: string }[] = [];

try {
  const { rows } = await pool.query<{ email: string }>(`
    SELECT DISTINCT ON (lower(email))
      lower(email) AS email
    FROM rsvp_submissions
    WHERE email IS NOT NULL
      AND trim(email) <> ''
    ORDER BY lower(email), created_at ASC
  `);

  const seen = new Set<string>();
  const recipients: string[] = [];

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    if (!EMAIL_RE.test(email)) {
      console.warn(`Skipping invalid email: ${email}`);
      continue;
    }
    seen.add(email);
    recipients.push(email);
  }

  console.log(`Sending "${mayGatheringTomorrowEmail.subject}" to ${recipients.length} recipients...`);

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
      failed++;
      failures.push({ email: to, error: JSON.stringify(error) });
      console.error(`Failed → ${to}:`, error);
    } else {
      sent++;
      console.log(`Sent (${sent}/${recipients.length}) → ${to} (${data?.id})`);
    }

    await new Promise((r) => setTimeout(r, 650));
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
  if (failures.length > 0) {
    console.log('Failures:');
    for (const f of failures) {
      console.log(`  ${f.email}: ${f.error}`);
    }
    process.exit(1);
  }
} finally {
  await pool.end();
}
