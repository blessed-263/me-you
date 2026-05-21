import type { Request, Response } from 'express';
import { Resend } from 'resend';
import type { Pool } from 'pg';
import {
  EVENT_TITLE,
  notifyDetailRow,
  renderRsvpConfirmationEmail,
  renderRsvpNotifyEmail,
} from './emailTemplates.js';
import {
  RSVP_SESSION_META,
  normalizeRsvpSessionId,
  type RsvpSessionId,
} from './rsvpSessions.js';

export type RsvpDeps = {
  getPool: () => Pool | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
    ALTER TABLE rsvp_submissions
    ADD COLUMN IF NOT EXISTS session text;
  `);
  await p.query(`
    DROP INDEX IF EXISTS rsvp_submissions_email_session_uidx;
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
  sessionId: RsvpSessionId;
  dietaryNotes: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const notifyTo = (process.env.RSVP_NOTIFY_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter((e) => EMAIL_RE.test(e));

  if (!apiKey || !from) {
    console.warn('[rsvp] RESEND_API_KEY or RESEND_FROM_EMAIL not set; skipping email.');
    return;
  }

  const session = RSVP_SESSION_META[payload.sessionId];
  const resend = new Resend(apiKey);
  const safeName = escapeHtml(payload.fullName);

  const notifyFields: { label: string; value: string }[] = [
    { label: 'Session', value: `${session.title} (${session.time})` },
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
  const notifyRows = notifyFields
    .map((field, i) =>
      notifyDetailRow(
        field.label,
        field.value,
        i === notifyFields.length - 1,
      ),
    )
    .join('');

  const emailPayload = {
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    sessionTitle: session.title,
    sessionTime: session.time,
    dietaryNotes: payload.dietaryNotes,
  };

  await resend.emails.send({
    from,
    to: payload.email,
    subject: `${EVENT_TITLE} — ${session.title} confirmed`,
    html: renderRsvpConfirmationEmail(safeName, session.title, session.time),
  });

  if (notifyTo.length > 0) {
    await resend.emails.send({
      from,
      to: notifyTo,
      subject: `New RSVP — ${session.title} — ${payload.fullName}`,
      html: renderRsvpNotifyEmail(safeName, emailPayload, notifyRows),
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
    const sessionRaw =
      typeof req.body?.session === 'string' ? req.body.session.trim() : '';

    if (!fullName || fullName.length > 120) {
      res.status(400).json({ error: 'Full name is required' });
      return;
    }
    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    const sessionId = normalizeRsvpSessionId(sessionRaw);
    if (!sessionId) {
      res.status(400).json({ error: 'A valid session is required' });
      return;
    }

    try {
      const existing = await p.query(
        `SELECT id FROM rsvp_submissions WHERE lower(email) = $1 LIMIT 1`,
        [email],
      );
      if (existing.rowCount && existing.rowCount > 0) {
        res.status(200).json({ ok: true, alreadySubmitted: true });
        return;
      }

      const result = await p.query(
        `INSERT INTO rsvp_submissions (full_name, email, phone, guest_count, dietary_notes, session)
         VALUES ($1, $2, $3, 1, $4, $5)
         ON CONFLICT ((lower(email))) DO NOTHING
         RETURNING id`,
        [fullName, email, phone, dietaryNotes, sessionId],
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
          sessionId,
          dietaryNotes,
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
