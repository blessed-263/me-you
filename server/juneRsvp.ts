import type { Request, Response } from 'express';
import { Resend } from 'resend';
import type { Pool } from 'pg';
import {
  renderJuneRsvpConfirmationEmail,
} from './emailTemplates.js';

export type JuneRsvpDeps = {
  getPool: () => Pool | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const JUNE_RSVP_TABLE = 'june_rsvps';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** June RSVPs — separate from May `rsvp_submissions`. */
export async function ensureJuneRsvpTable(getPool: () => Pool | null): Promise<void> {
  const p = getPool();
  if (!p) {
    console.warn(
      '[june-rsvp] DATABASE_URL is not set; POST /api/rsvp/june will return 503.',
    );
    return;
  }

  await p.query(`
    CREATE TABLE IF NOT EXISTS ${JUNE_RSVP_TABLE} (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name text NOT NULL,
      email text NOT NULL,
      phone text,
      guest_count smallint NOT NULL DEFAULT 1,
      dietary_notes text,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT june_rsvp_guest_count_range CHECK (guest_count >= 1 AND guest_count <= 20)
    );
  `);

  try {
    await p.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS june_rsvps_email_lower_idx
      ON ${JUNE_RSVP_TABLE} (lower(email));
    `);
  } catch (err) {
    console.error(
      '[june-rsvp] Could not create unique index on lower(email). Check for duplicate emails.',
      err,
    );
    throw err;
  }

  console.log(`[june-rsvp] Table ${JUNE_RSVP_TABLE} is ready (one RSVP per email).`);
}

async function sendJuneRsvpEmails(payload: {
  fullName: string;
  email: string;
  phone: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    console.warn('[june-rsvp] RESEND_API_KEY or RESEND_FROM_EMAIL not set; skipping email.');
    return;
  }

  const resend = new Resend(apiKey);
  const safeName = escapeHtml(payload.fullName);

  await resend.emails.send({
    from,
    to: payload.email,
    subject: 'YOU&ME — September RSVP confirmed',
    html: renderJuneRsvpConfirmationEmail(safeName),
  });
}

export function createJuneRsvpHandler(deps: JuneRsvpDeps) {
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

    if (!fullName || fullName.length > 120) {
      res.status(400).json({ error: 'Full name is required' });
      return;
    }
    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    try {
      const existing = await p.query(
        `SELECT id FROM ${JUNE_RSVP_TABLE} WHERE lower(email) = $1 LIMIT 1`,
        [email],
      );
      if (existing.rowCount && existing.rowCount > 0) {
        res.status(200).json({ ok: true, alreadySubmitted: true });
        return;
      }

      const result = await p.query(
        `INSERT INTO ${JUNE_RSVP_TABLE} (full_name, email, phone, guest_count)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT ((lower(email))) DO NOTHING
         RETURNING id`,
        [fullName, email, phone],
      );

      if (result.rowCount === 0) {
        res.status(200).json({ ok: true, alreadySubmitted: true });
        return;
      }

      try {
        await sendJuneRsvpEmails({ fullName, email, phone });
      } catch (mailErr) {
        console.error('[june-rsvp] email failed (submission saved)', mailErr);
      }

      res.status(201).json({ ok: true });
    } catch (err) {
      console.error('[june-rsvp] insert failed', err);
      res.status(500).json({ error: 'Could not save RSVP' });
    }
  };
}
