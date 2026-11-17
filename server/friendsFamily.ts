import type { Express, Request, RequestHandler, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { Pool } from 'pg';
import { Resend } from 'resend';
import {
  getInviteToken,
  isOrganiserConfigured,
  isValidInviteToken,
  isValidOrganiserSession,
  isValidPasscode,
  issueOrganiserSession,
} from './friendsFamilyAuth.js';
import {
  renderFfApprovedEmail,
  renderFfDeclinedEmail,
  renderFfGuestEmail,
  renderFfHostNotifyEmail,
  type EmailContent,
} from './friendsFamilyEmails.js';

/** What happened to the Approve / Decline email for this status change. */
export type DecisionEmailResult = 'none' | 'sent' | 'already-sent' | 'not-attending' | 'failed';
import { FF_STATUSES, FF_TABLE, ffInviteUrl, validateFfRsvp, type FfStatus } from './friendsFamilyMeta.js';
import { requireAllowedOrigin } from './middleware/requireAllowedOrigin.js';

/**
 * Friends & Family — invitation-only RSVP (22 November 2026).
 *
 * Public (needs the secret invite token):
 *   POST /api/ff/invite   { token }                         → 200 { ok } | 404
 *   POST /api/ff/rsvp     { token, firstName, surname, mobile, email, attending }
 * Organiser (shared passcode → signed session, sent in the JSON body):
 *   POST /api/ff/organiser/login    { passcode }            → { session, expiresAt }
 *   POST /api/ff/organiser/list     { session }             → { rsvps }
 *   POST /api/ff/organiser/status   { session, id, status }
 *   POST /api/ff/organiser/checkin  { session, id, arrived }
 *
 * The rate limits here are always on (in-memory per instance), independent of
 * RATE_LIMIT_ENABLED, because every accepted RSVP sends an email.
 */

export type SendEmail = (to: string, email: EmailContent) => Promise<void>;

export type FriendsFamilyDeps = {
  getPool: () => Pool | null;
  sendEmail?: SendEmail;
};

/**
 * RSVPs closed on 17 November 2026: new submissions are refused (410).
 * Existing RSVPs and the organiser guest list are unaffected.
 * Set FF_RSVP_OPEN=true on the server to accept RSVPs again.
 */
export function isFfRsvpClosed(): boolean {
  return process.env.FF_RSVP_OPEN !== 'true';
}

const UUID_RE =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function ensureFriendsFamilyTable(getPool: () => Pool | null): Promise<void> {
  const p = getPool();
  if (!p) {
    console.warn('[ff-rsvp] DATABASE_URL is not set; Friends & Family RSVPs will return 503.');
    return;
  }
  await p.query(`
    CREATE TABLE IF NOT EXISTS ${FF_TABLE} (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name text NOT NULL,
      surname text NOT NULL,
      mobile text NOT NULL,
      email text NOT NULL,
      attending boolean NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      arrived boolean NOT NULL DEFAULT false,
      checked_in_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT friends_family_rsvps_status_valid CHECK (status IN ('pending', 'approved', 'declined'))
    );
  `);
  await p.query(`ALTER TABLE ${FF_TABLE} ADD COLUMN IF NOT EXISTS arrived boolean NOT NULL DEFAULT false;`);
  await p.query(`ALTER TABLE ${FF_TABLE} ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;`);
  // When the organiser's Approve / Decline decision email was sent (once each).
  await p.query(`ALTER TABLE ${FF_TABLE} ADD COLUMN IF NOT EXISTS approved_email_sent_at timestamptz;`);
  await p.query(`ALTER TABLE ${FF_TABLE} ADD COLUMN IF NOT EXISTS declined_email_sent_at timestamptz;`);
  await p.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS friends_family_rsvps_email_lower_idx
    ON ${FF_TABLE} (lower(email));
  `);
  if (!getInviteToken()) {
    console.log('[ff-rsvp] FF_INVITE_TOKEN not set; using the built-in invite token fingerprint.');
  }
  if (!isOrganiserConfigured()) {
    console.warn('[ff-rsvp] FF_ORGANISER_PASSCODE is not set; the organiser guest list is locked.');
  }
  console.log(`[ff-rsvp] Table ${FF_TABLE} is ready (one RSVP per email).`);
}

const defaultSendEmail: SendEmail = async (to, email) => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    // Throw so callers report "not sent" (never claim an email went out when it didn't).
    throw new Error('RESEND_API_KEY or RESEND_FROM_EMAIL not set; email not sent.');
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
};

function limiter(max: number, windowMinutes: number, skipSuccessful = false): RequestHandler {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccessful,
    message: { error: 'Too many requests' },
  });
}

type RsvpRow = {
  id: string;
  first_name: string;
  surname: string;
  mobile: string;
  email: string;
  attending: boolean;
  status: FfStatus;
  arrived: boolean;
  checked_in_at: Date | null;
  approved_email_sent_at?: Date | null;
  declined_email_sent_at?: Date | null;
  created_at: Date;
  updated_at: Date;
};

function toApi(row: RsvpRow) {
  return {
    id: row.id,
    firstName: row.first_name,
    surname: row.surname,
    mobile: row.mobile,
    email: row.email,
    attending: row.attending,
    status: row.status,
    arrived: row.arrived,
    checkedInAt: row.checked_in_at ? new Date(row.checked_in_at).toISOString() : null,
    approvedEmailSentAt: row.approved_email_sent_at ? new Date(row.approved_email_sent_at).toISOString() : null,
    declinedEmailSentAt: row.declined_email_sent_at ? new Date(row.declined_email_sent_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function requireSession(req: Request, res: Response): boolean {
  if (!isValidOrganiserSession(req.body?.session)) {
    res.status(401).json({ error: 'Not signed in' });
    return false;
  }
  return true;
}

export function registerFriendsFamilyRoutes(app: Express, deps: FriendsFamilyDeps): void {
  const sendEmail = deps.sendEmail ?? defaultSendEmail;
  const inviteLimit = limiter(60, 15);
  const rsvpLimit = limiter(20, 15);
  const loginLimit = limiter(10, 15, true);
  const organiserLimit = limiter(600, 15);

  app.post('/api/ff/invite', inviteLimit, (req, res) => {
    if (isValidInviteToken(req.body?.token)) {
      res.json({ ok: true });
      return;
    }
    res.status(404).json({ ok: false });
  });

  app.post('/api/ff/rsvp', requireAllowedOrigin, rsvpLimit, async (req, res) => {
    if (!isValidInviteToken(req.body?.token)) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }
    if (isFfRsvpClosed()) {
      res.status(410).json({ error: 'RSVPs are closed' });
      return;
    }
    const parsed = validateFfRsvp(req.body);
    if ('fields' in parsed) {
      res.status(400).json({ error: 'Please check the highlighted fields', fields: parsed.fields });
      return;
    }
    const p = deps.getPool();
    if (!p) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }
    const g = parsed.value;
    let created = false;
    let answerChanged = false;
    try {
      const result = await p.query<{ inserted: boolean; prev_attending: boolean | null }>(
        `WITH prev AS (
           SELECT attending FROM ${FF_TABLE} WHERE lower(email) = $4
         )
         INSERT INTO ${FF_TABLE} (first_name, surname, mobile, email, attending)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT ((lower(email))) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           surname = EXCLUDED.surname,
           mobile = EXCLUDED.mobile,
           attending = EXCLUDED.attending,
           updated_at = now()
         RETURNING (xmax = 0) AS inserted, (SELECT attending FROM prev) AS prev_attending`,
        [g.firstName, g.surname, g.mobile, g.email, g.attending],
      );
      const row = result.rows[0];
      created = Boolean(row?.inserted);
      answerChanged = !created && row?.prev_attending !== g.attending;
    } catch (err) {
      console.error('[ff-rsvp] save failed', err);
      res.status(500).json({ error: 'Could not save RSVP' });
      return;
    }

    if (created || answerChanged) {
      // The guest's own (already validated) link token, so it works with or without FF_INVITE_TOKEN.
      const token = String(req.body.token);
      const jobs: Promise<void>[] = [
        sendEmail(g.email, renderFfGuestEmail(g.firstName, g.attending, ffInviteUrl(token))),
      ];
      const notify = process.env.RSVP_NOTIFY_EMAIL?.trim();
      if (notify) {
        jobs.push(sendEmail(notify, renderFfHostNotifyEmail({ ...g, created })));
      }
      const results = await Promise.allSettled(jobs);
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(
            `[ff-rsvp] ${i === 0 ? 'guest confirmation' : 'host notification'} email failed (RSVP saved)`,
            r.reason,
          );
        }
      });
    }

    res.status(created ? 201 : 200).json({ ok: true, created });
  });

  app.post('/api/ff/organiser/login', loginLimit, (req, res) => {
    if (!isOrganiserConfigured()) {
      res.status(503).json({ error: 'Organiser access is not set up' });
      return;
    }
    if (!isValidPasscode(req.body?.passcode)) {
      res.status(401).json({ error: 'Wrong passcode' });
      return;
    }
    res.json(issueOrganiserSession());
  });

  app.post('/api/ff/organiser/list', organiserLimit, async (req, res) => {
    if (!requireSession(req, res)) return;
    const p = deps.getPool();
    if (!p) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }
    try {
      const result = await p.query<RsvpRow>(
        `SELECT id, first_name, surname, mobile, email, attending, status, arrived,
                checked_in_at, created_at, updated_at, approved_email_sent_at, declined_email_sent_at
         FROM ${FF_TABLE} ORDER BY created_at DESC`,
      );
      res.json({ rsvps: result.rows.map(toApi) });
    } catch (err) {
      console.error('[ff-rsvp] list failed', err);
      res.status(500).json({ error: 'Could not load the guest list' });
    }
  });

  app.post('/api/ff/organiser/status', organiserLimit, async (req, res) => {
    if (!requireSession(req, res)) return;
    const { id, status } = req.body ?? {};
    if (typeof id !== 'string' || !UUID_RE.test(id) || !FF_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    const p = deps.getPool();
    if (!p) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }
    try {
      const result = await p.query<RsvpRow>(
        `UPDATE ${FF_TABLE} SET status = $2, updated_at = now() WHERE id = $1
         RETURNING id, first_name, surname, mobile, email, attending, status, arrived,
                   checked_in_at, created_at, updated_at, approved_email_sent_at, declined_email_sent_at`,
        [id, status],
      );
      let row = result.rows[0];
      if (!row) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      // Decision email: once per decision, only to guests who said they're attending.
      let email: DecisionEmailResult = 'none';
      if (status === 'approved' || status === 'declined') {
        const col = status === 'approved' ? 'approved_email_sent_at' : 'declined_email_sent_at';
        if (!row.attending) {
          email = 'not-attending';
        } else if (row[col]) {
          email = 'already-sent';
        } else {
          // Claim the send atomically so two quick presses can never email twice.
          const claim = await p.query<RsvpRow>(
            `UPDATE ${FF_TABLE} SET ${col} = now() WHERE id = $1 AND ${col} IS NULL
             RETURNING id, first_name, surname, mobile, email, attending, status, arrived,
                       checked_in_at, created_at, updated_at, approved_email_sent_at, declined_email_sent_at`,
            [id],
          );
          if (!claim.rows[0]) {
            email = 'already-sent';
          } else {
            row = claim.rows[0];
            try {
              const content =
                status === 'approved'
                  ? renderFfApprovedEmail(row.first_name)
                  : renderFfDeclinedEmail(row.first_name);
              await sendEmail(row.email, content);
              email = 'sent';
            } catch (mailErr) {
              console.error(`[ff-rsvp] ${status} email failed (status saved)`, mailErr);
              const undo = await p.query<RsvpRow>(
                `UPDATE ${FF_TABLE} SET ${col} = NULL WHERE id = $1
                 RETURNING id, first_name, surname, mobile, email, attending, status, arrived,
                           checked_in_at, created_at, updated_at, approved_email_sent_at, declined_email_sent_at`,
                [id],
              );
              row = undo.rows[0] ?? row;
              email = 'failed';
            }
          }
        }
      }
      res.json({ rsvp: toApi(row), email });
    } catch (err) {
      console.error('[ff-rsvp] status update failed', err);
      res.status(500).json({ error: 'Could not save that change' });
    }
  });

  app.post('/api/ff/organiser/checkin', organiserLimit, async (req, res) => {
    if (!requireSession(req, res)) return;
    const { id, arrived } = req.body ?? {};
    if (typeof id !== 'string' || !UUID_RE.test(id) || typeof arrived !== 'boolean') {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    const p = deps.getPool();
    if (!p) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }
    try {
      const result = await p.query<RsvpRow>(
        `UPDATE ${FF_TABLE}
         SET arrived = $2,
             checked_in_at = CASE WHEN $2 THEN now() ELSE NULL END,
             updated_at = now()
         WHERE id = $1
         RETURNING id, first_name, surname, mobile, email, attending, status, arrived,
                   checked_in_at, created_at, updated_at, approved_email_sent_at, declined_email_sent_at`,
        [id, arrived],
      );
      if (!result.rows[0]) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json({ rsvp: toApi(result.rows[0]) });
    } catch (err) {
      console.error('[ff-rsvp] check-in failed', err);
      res.status(500).json({ error: 'Could not save that change' });
    }
  });
}
