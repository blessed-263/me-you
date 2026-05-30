/**
 * Bulk-send the Harvest Table guest email to the RSVP CSV export.
 *
 * Input CSV shape (from scripts/export-rsvps.ts):
 * full_name,email,phone,guest_count,session,created_at
 *
 * Usage:
 *   npx tsx scripts/send-harvest-table-from-csv.ts harvest-table-rsvps.csv
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { Resend } from 'resend';
import { harvestTableGuestEmail } from '../emails/harvest-table.content.js';
import { prepareGuestEmailSend } from '../server/guestEmailSend.js';

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

const csvPath = process.argv[2]?.trim() || 'harvest-table-rsvps.csv';

function capitalizeWord(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function greetingNameFromFullName(fullNameRaw: string, email: string): string {
  const fullName = fullNameRaw.trim();
  if (!fullName) return 'there';

  // Exception: keep Picat's full name.
  if (email.toLowerCase() === 'djpicat@gmail.com') {
    return fullName;
  }

  const parts = fullName.split(/\s+/).filter(Boolean);
  const chosen = parts.length >= 3 ? parts.slice(0, 2) : parts.slice(0, 1);
  const name = chosen.map(capitalizeWord).join(' ').trim();
  return name || 'there';
}

function parseCsvLine(line: string): string[] {
  // Minimal CSV parser for quoted values + escaped quotes.
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
const fullNameIdx = header.indexOf('full_name');
const emailIdx = header.indexOf('email');
if (fullNameIdx === -1 || emailIdx === -1) {
  console.error(`CSV missing required columns. Found: ${header.join(', ')}`);
  process.exit(1);
}

const deduped = new Map<string, { email: string; fullName: string }>();
for (const line of lines.slice(1)) {
  const cols = parseCsvLine(line);
  const email = (cols[emailIdx] ?? '').trim().toLowerCase();
  const fullName = (cols[fullNameIdx] ?? '').trim();
  if (!email.includes('@')) continue;
  if (!deduped.has(email)) {
    deduped.set(email, { email, fullName });
  }
}

const resend = new Resend(apiKey);

console.log(`Sending Harvest Table to ${deduped.size} recipients...`);

for (const { email: to, fullName } of deduped.values()) {
  const guestName = greetingNameFromFullName(fullName, to);
  const { html, attachments } = prepareGuestEmailSend(
    harvestTableGuestEmail,
    guestName,
  );

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: harvestTableGuestEmail.subject,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  if (error) {
    console.error(`Failed (Harvest Table → ${to}):`, error);
    process.exit(1);
  }

  console.log(`Sent Harvest Table → ${to} as "${guestName}" (${data?.id})`);
  await new Promise((r) => setTimeout(r, 650));
}

console.log('Done.');

