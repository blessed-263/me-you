/**
 * Bulk-send the After Lunch Party day-of email to after-party RSVPs.
 *
 * Usage:
 *   npx tsx scripts/send-after-party-day-of-from-csv.ts after-party-lunch-rsvps.csv
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { Resend } from 'resend';
import { afterPartyDayOfEmail } from '../emails/after-party-day-of.content.js';
import { buildGuestEmailSend } from '../server/guestEmailSend.js';

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

const csvPath = process.argv[2]?.trim() || 'after-party-lunch-rsvps.csv';

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i] ?? '';
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }

  out.push(cur);
  return out;
}

const raw = readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/).filter(Boolean);
if (lines.length <= 1) {
  console.error(`No rows found in ${csvPath}`);
  process.exit(1);
}

const header = parseCsvLine(lines[0] ?? '');
const emailIdx = header.indexOf('email');
if (emailIdx === -1) {
  console.error(`CSV missing email column. Found: ${header.join(', ')}`);
  process.exit(1);
}

const deduped = new Set<string>();
for (const line of lines.slice(1)) {
  const cols = parseCsvLine(line);
  const email = (cols[emailIdx] ?? '').trim().toLowerCase();
  if (email.includes('@')) deduped.add(email);
}

const resend = new Resend(apiKey);
const { html, text, attachments, replyTo } = buildGuestEmailSend(
  afterPartyDayOfEmail,
);

console.log(`Sending After Lunch Party day-of to ${deduped.size} recipients...`);

for (const to of deduped) {
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
    console.error(`Failed (After Lunch Party day-of → ${to}):`, error);
    process.exit(1);
  }

  console.log(`Sent After Lunch Party day-of → ${to} (${data?.id})`);
  await new Promise((r) => setTimeout(r, 650));
}

console.log('Done.');
