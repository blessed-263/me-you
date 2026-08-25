import type { Request, Response } from 'express';
import { Resend } from 'resend';
import type { Pool } from 'pg';
import {
  renderThirdEditionRsvpConfirmationEmail,
} from './emailTemplates.js';

export {
  THIRD_EDITION_DATE_LABEL,
  THIRD_EDITION_DATE_SHORT,
} from './thirdEditionMeta.js';

export type ThirdEditionRsvpDeps = {
  getPool: () => Pool | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const THIRD_EDITION_RSVP_TABLE = 'third_edition_rsvps';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Third edition RSVPs — separate from May `rsvp_submissions` and June waitlist. */
export async function ensureThirdEditionRsvpTable(getPool: () => Pool | null): Promise<void> {
  const p = getPool();
  if (!p) {
    console.warn(
      '[third-edition-rsvp] DATABASE_URL is not set; POST /api/rsvp/third will return 503.',
    );
    return;
  }

  await p.query(`
    CREATE TABLE IF NOT EXISTS ${THIRD_EDITION_RSVP_TABLE} (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name text NOT NULL,
      email text NOT NULL,
      phone text,
      session text,
      guest_count smallint NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT third_edition_rsvp_guest_count_range CHECK (guest_count >= 1 AND guest_count <= 20)
    );
  `);

  await p.query(`
    ALTER TABLE ${THIRD_EDITION_RSVP_TABLE}
    ALTER COLUMN session DROP NOT NULL;
  `).catch(() => {
    /* column may already be nullable */
  });

  await p.query(`
    ALTER TABLE ${THIRD_EDITION_RSVP_TABLE}
    DROP CONSTRAINT IF EXISTS third_edition_rsvp_session_valid;
  `);

  try {
    await p.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS third_edition_rsvps_email_lower_idx
      ON ${THIRD_EDITION_RSVP_TABLE} (lower(email));
    `);
  } catch (err) {
    console.error(
      '[third-edition-rsvp] Could not create unique index on lower(email). Check for duplicate emails.',
      err,
    );
    throw err;
  }

  console.log(
    `[third-edition-rsvp] Table ${THIRD_EDITION_RSVP_TABLE} is ready (one RSVP per email).`,
  );
}

async function sendThirdEditionRsvpEmails(payload: {
  fullName: string;
  email: string;
  phone: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    console.warn(
      '[third-edition-rsvp] RESEND_API_KEY or RESEND_FROM_EMAIL not set; skipping email.',
    );
    return;
  }

  const resend = new Resend(apiKey);
  const safeName = escapeHtml(payload.fullName);

  await resend.emails.send({
    from,
    to: payload.email,
    subject: `YOU&ME — Third edition RSVP confirmed`,
    html: renderThirdEditionRsvpConfirmationEmail(safeName),
  });
}

export function createThirdEditionRsvpHandler(deps: ThirdEditionRsvpDeps) {
  return async (req: Request, res: Response): Promise<void> => {
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

    const p = deps.getPool();
    if (!p) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    try {
      const existing = await p.query(
        `SELECT id FROM ${THIRD_EDITION_RSVP_TABLE} WHERE lower(email) = $1 LIMIT 1`,
        [email],
      );
      if (existing.rowCount && existing.rowCount > 0) {
        res.status(200).json({ ok: true, alreadySubmitted: true });
        return;
      }

      const result = await p.query(
        `INSERT INTO ${THIRD_EDITION_RSVP_TABLE} (full_name, email, phone, guest_count)
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
        await sendThirdEditionRsvpEmails({ fullName, email, phone });
      } catch (mailErr) {
        console.error('[third-edition-rsvp] email failed (submission saved)', mailErr);
      }

      res.status(201).json({ ok: true });
    } catch (err) {
      console.error('[third-edition-rsvp] insert failed', err);
      res.status(500).json({ error: 'Could not save RSVP' });
    }
  };
}
