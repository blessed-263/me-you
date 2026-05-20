import type { Request, Response } from 'express';
import { Resend } from 'resend';
import type { Pool } from 'pg';
import {
  EVENT_TITLE,
  notifyDetailRow,
  renderRsvpConfirmationEmail,
  renderRsvpNotifyEmail,
} from './emailTemplates.js';

export type RsvpDeps = {
  getPool: () => Pool | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function ensureRsvpTable(getPool: () => Pool | null): Promise<void> {
  const p = getPool();
  if (!p) {
    console.warn(
      '[rsvp] DATABASE_URL is not set; POST /api/rsvp will return 503.',
    );
    return;
  }
  await p.query(`
    CREATE TABLE IF NOT EXISTS rsvp_submissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name text NOT NULL,
      email text NOT NULL,
      phone text,
      guest_count smallint NOT NULL DEFAULT 1,
      dietary_notes text,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT rsvp_guest_count_range CHECK (guest_count >= 1 AND guest_count <= 20)
    );
  `);
  await p.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS rsvp_submissions_email_lower_idx
    ON rsvp_submissions (lower(email));
  `);
  console.log('[rsvp] Table rsvp_submissions is ready.');
}

async function sendRsvpEmails(payload: {
  fullName: string;
  email: string;
  phone: string | null;
  guestCount: number;
  dietaryNotes: string | null;
  notes: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const notifyTo = process.env.RSVP_NOTIFY_EMAIL?.trim();

  if (!apiKey || !from) {
    console.warn('[rsvp] RESEND_API_KEY or RESEND_FROM_EMAIL not set; skipping email.');
    return;
  }

  const resend = new Resend(apiKey);
  const safeName = escapeHtml(payload.fullName);

  const notifyFields: { label: string; value: string }[] = [
    { label: 'Guests', value: String(payload.guestCount) },
  ];
  if (payload.phone) {
    notifyFields.push({ label: 'Phone', value: escapeHtml(payload.phone) });
  }
  if (payload.dietaryNotes) {
    notifyFields.push({
      label: 'Dietary',
      value: escapeHtml(payload.dietaryNotes),
    });
  }
  if (payload.notes) {
    notifyFields.push({ label: 'Notes', value: escapeHtml(payload.notes) });
  }
  const notifyRows = notifyFields
    .map((field, i) =>
      notifyDetailRow(
        field.label,
        field.value,
        i === notifyFields.length - 1,
      ),
    )
    .join('');

  await resend.emails.send({
    from,
    to: payload.email,
    subject: `${EVENT_TITLE} — Your RSVP is confirmed`,
    html: renderRsvpConfirmationEmail(safeName, payload.guestCount),
  });

  if (notifyTo) {
    await resend.emails.send({
      from,
      to: notifyTo,
      subject: `New RSVP — ${EVENT_TITLE} — ${payload.fullName}`,
      html: renderRsvpNotifyEmail(safeName, payload, notifyRows),
    });
  }
}

export function createRsvpHandler(deps: RsvpDeps) {
  return async (req: Request, res: Response): Promise<void> => {
    const p = deps.getPool();
    if (!p) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const fullName =
      typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    const rawEmail =
      typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const email = rawEmail.toLowerCase();
    const phone =
      typeof req.body?.phone === 'string' && req.body.phone.trim()
        ? req.body.phone.trim()
        : null;
    const dietaryNotes =
      typeof req.body?.dietaryNotes === 'string' && req.body.dietaryNotes.trim()
        ? req.body.dietaryNotes.trim().slice(0, 500)
        : null;
    const notes =
      typeof req.body?.notes === 'string' && req.body.notes.trim()
        ? req.body.notes.trim().slice(0, 500)
        : null;

    const guestCountRaw = req.body?.guestCount;
    const guestCount =
      typeof guestCountRaw === 'number'
        ? guestCountRaw
        : typeof guestCountRaw === 'string'
          ? Number.parseInt(guestCountRaw, 10)
          : NaN;

    if (!fullName || fullName.length > 120) {
      res.status(400).json({ error: 'Full name is required' });
      return;
    }
    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
      res.status(400).json({ error: 'Guest count must be between 1 and 20' });
      return;
    }

    try {
      const result = await p.query(
        `INSERT INTO rsvp_submissions (full_name, email, phone, guest_count, dietary_notes, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT ((lower(email))) DO NOTHING
         RETURNING id`,
        [fullName, email, phone, guestCount, dietaryNotes, notes],
      );

      if (result.rowCount === 0) {
        res.status(200).json({ ok: true, alreadySubmitted: true });
        return;
      }

      try {
        await sendRsvpEmails({
          fullName,
          email,
          phone,
          guestCount,
          dietaryNotes,
          notes,
        });
      } catch (mailErr) {
        console.error('[rsvp] email failed (submission saved)', mailErr);
      }

      res.status(201).json({ ok: true });
    } catch (err) {
      console.error('[rsvp] insert failed', err);
      res.status(500).json({ error: 'Could not save RSVP' });
    }
  };
}
