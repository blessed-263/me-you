import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Pool } from 'pg';
import { randomUUID } from 'node:crypto';

/**
 * Friends & Family API tests. A tiny in-memory stand-in for Postgres handles the
 * five queries the routes use; the real SQL is exercised against Postgres in
 * the manual checklist (docs/friends-family-rsvp.md).
 */

const TOKEN = 'test-token-abcdefghijklmnop';
const PASSCODE = 'test-passcode';

type Row = {
  id: string;
  first_name: string;
  surname: string;
  mobile: string;
  email: string;
  attending: boolean;
  status: string;
  arrived: boolean;
  checked_in_at: Date | null;
  approved_email_sent_at?: Date | null;
  declined_email_sent_at?: Date | null;
  tags?: string[];
  guest_of?: string | null;
  created_at: Date;
  updated_at: Date;
};

function fakePool() {
  const rows: Row[] = [];
  const query = async (sql: string, params: unknown[] = []) => {
    if (sql.includes('WITH prev')) {
      const [first, surname, mobile, email, attending] = params as [string, string, string, string, boolean];
      const existing = rows.find((r) => r.email.toLowerCase() === email);
      if (existing) {
        const prev = existing.attending;
        Object.assign(existing, { first_name: first, surname, mobile, attending, updated_at: new Date() });
        return { rows: [{ inserted: false, prev_attending: prev }], rowCount: 1 };
      }
      rows.push({
        id: randomUUID(),
        first_name: first,
        surname,
        mobile,
        email,
        attending,
        status: 'pending',
        arrived: false,
        checked_in_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      return { rows: [{ inserted: true, prev_attending: null }], rowCount: 1 };
    }
    const dup = (email: string, exceptId?: string) =>
      rows.some((x) => x.email.toLowerCase() === email && x.id !== exceptId);
    if (sql.includes('SET first_name = $2')) {
      const [rid, first, surname, mobile, email, attending] = params as [string, string, string, string, string, boolean];
      if (dup(email, rid)) throw Object.assign(new Error('duplicate'), { code: '23505' });
      const r = rows.find((x) => x.id === rid);
      if (r) Object.assign(r, { first_name: first, surname, mobile, email, attending, updated_at: new Date() });
      return { rows: r ? [r] : [], rowCount: r ? 1 : 0 };
    }
    if (sql.trim().startsWith('INSERT INTO')) {
      const [first, surname, mobile, email, attending] = params as [string, string, string, string, boolean];
      if (dup(email)) throw Object.assign(new Error('duplicate'), { code: '23505' });
      const r: Row = {
        id: randomUUID(), first_name: first, surname, mobile, email, attending, status: 'pending', arrived: false,
        checked_in_at: null, created_at: new Date(), updated_at: new Date(),
      };
      rows.push(r);
      return { rows: [r], rowCount: 1 };
    }
    if (sql.trim().startsWith('DELETE FROM')) {
      const i = rows.findIndex((x) => x.id === params[0]);
      if (i < 0) return { rows: [], rowCount: 0 };
      const [r] = rows.splice(i, 1);
      return { rows: [{ id: r.id }], rowCount: 1 };
    }
    if (sql.includes('SET tags')) {
      const r = rows.find((x) => x.id === params[0]);
      if (r) Object.assign(r, { tags: params[1], guest_of: params[2] });
      return { rows: r ? [r] : [], rowCount: r ? 1 : 0 };
    }
    const claim = sql.match(/SET (approved|declined)_email_sent_at = (now\(\)|NULL)/);
    if (claim) {
      const key = `${claim[1]}_email_sent_at` as 'approved_email_sent_at' | 'declined_email_sent_at';
      const r = rows.find((x) => x.id === params[0]);
      if (!r) return { rows: [], rowCount: 0 };
      if (claim[2] === 'NULL') {
        r[key] = null;
        return { rows: [r], rowCount: 1 };
      }
      if (r[key]) return { rows: [], rowCount: 0 };
      r[key] = new Date();
      return { rows: [r], rowCount: 1 };
    }
    if (sql.includes('SET status')) {
      const r = rows.find((x) => x.id === params[0]);
      if (r) Object.assign(r, { status: params[1], updated_at: new Date() });
      return { rows: r ? [r] : [], rowCount: r ? 1 : 0 };
    }
    if (sql.includes('SET arrived')) {
      const r = rows.find((x) => x.id === params[0]);
      if (r) {
        r.arrived = params[1] as boolean;
        r.checked_in_at = r.arrived ? new Date() : null;
      }
      return { rows: r ? [r] : [], rowCount: r ? 1 : 0 };
    }
    if (sql.trim().startsWith('SELECT id')) {
      return { rows: [...rows].reverse(), rowCount: rows.length };
    }
    throw new Error(`unexpected query: ${sql}`);
  };
  return { rows, pool: { query } as unknown as Pool };
}

const guest = {
  token: TOKEN,
  firstName: 'Test',
  surname: 'Delete-Me',
  mobile: '082 123 4567',
  email: 'Test.Delete-Me@Example.com',
  attending: true,
};

describe('Friends & Family API', () => {
  const originalEnv = { ...process.env };
  let sent: { to: string; subject: string }[];
  let failEmail: boolean;

  beforeEach(() => {
    vi.resetModules();
    // RSVPs are closed by default; these tests exercise the open flow.
    process.env = { ...originalEnv, FF_INVITE_TOKEN: TOKEN, FF_ORGANISER_PASSCODE: PASSCODE, FF_RSVP_OPEN: 'true' };
    process.env.RSVP_NOTIFY_EMAIL = 'hosts@example.com';
    delete process.env.NODE_ENV;
    delete process.env.RAILWAY_ENVIRONMENT;
    sent = [];
    failEmail = false;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function loadApp(pool: Pool | null) {
    const { createApp } = await import('../app.js');
    return createApp({
      getPoolFn: () => pool,
      ffSendEmail: async (to, email) => {
        if (failEmail) throw new Error('resend down');
        sent.push({ to, subject: email.subject });
      },
    });
  }

  it('invite check: valid, wrong and missing token', async () => {
    const app = await loadApp(null);
    expect((await request(app).post('/api/ff/invite').send({ token: TOKEN })).status).toBe(200);
    expect((await request(app).post('/api/ff/invite').send({ token: 'nope-nope-nope-nope' })).status).toBe(404);
    expect((await request(app).post('/api/ff/invite').send({})).status).toBe(404);
  });

  it('invite check fails closed when FF_INVITE_TOKEN is not set', async () => {
    delete process.env.FF_INVITE_TOKEN;
    const app = await loadApp(null);
    expect((await request(app).post('/api/ff/invite').send({ token: TOKEN })).status).toBe(404);
  });

  it('rsvp is closed by default: refuses new RSVPs, guest list still works', async () => {
    delete process.env.FF_RSVP_OPEN;
    const { pool, rows } = fakePool();
    const app = await loadApp(pool);
    const res = await request(app).post('/api/ff/rsvp').send(guest);
    expect(res.status).toBe(410);
    expect(rows).toHaveLength(0);
    expect(sent).toHaveLength(0);
    const wrongToken = await request(app).post('/api/ff/rsvp').send({ ...guest, token: 'wrong-wrong-wrong-wrong' });
    expect(wrongToken.status).toBe(404);
    const login = await request(app).post('/api/ff/organiser/login').send({ passcode: PASSCODE });
    const list = await request(app).post('/api/ff/organiser/list').send({ session: login.body.session });
    expect(list.status).toBe(200);
  });

  it('rsvp rejects a missing or wrong token before anything else', async () => {
    const { pool, rows } = fakePool();
    const app = await loadApp(pool);
    const res = await request(app).post('/api/ff/rsvp').send({ ...guest, token: 'wrong-wrong-wrong-wrong' });
    expect(res.status).toBe(404);
    const res2 = await request(app).post('/api/ff/rsvp').send({ ...guest, token: undefined });
    expect(res2.status).toBe(404);
    expect(rows).toHaveLength(0);
  });

  it('rsvp validates every field on the server with the spec wording', async () => {
    const app = await loadApp(fakePool().pool);
    const res = await request(app).post('/api/ff/rsvp').send({ token: TOKEN });
    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual({
      firstName: 'Please add your first name.',
      surname: 'Please add your surname.',
      mobile: 'Please add your mobile number.',
      email: 'Please add your email address.',
      attending: 'Please let us know if you can make it.',
    });
    for (const mobile of ['012 345 6789', '+1 555 123 4567']) {
      const bad = await request(app).post('/api/ff/rsvp').send({ ...guest, mobile });
      expect(bad.body.fields.mobile).toBe('Use a South African mobile number, e.g. +27 82 123 4567.');
    }
    for (const email of ['no-at-sign.com', 'name@nodot']) {
      const bad = await request(app).post('/api/ff/rsvp').send({ ...guest, email });
      expect(bad.body.fields.email).toBe('Please check your email address.');
    }
  });

  it('saves pending, normalises, upserts by email and keeps status', async () => {
    const { pool, rows } = fakePool();
    const app = await loadApp(pool);

    const first = await request(app).post('/api/ff/rsvp').send(guest);
    expect(first.status).toBe(201);
    expect(first.body).toEqual({ ok: true, created: true });
    expect(rows[0]).toMatchObject({ mobile: '+27821234567', email: 'test.delete-me@example.com', status: 'pending' });
    // guest confirmation + host notification
    expect(sent.map((s) => s.to)).toEqual(['test.delete-me@example.com', 'hosts@example.com']);
    expect(sent[0].subject).toBe('Your RSVP for Friends & Family is received');

    rows[0].status = 'approved';
    sent = [];
    const same = await request(app)
      .post('/api/ff/rsvp')
      .send({ ...guest, email: 'TEST.DELETE-ME@EXAMPLE.COM', mobile: '+27 82 123 4567' });
    expect(same.status).toBe(200);
    expect(same.body).toEqual({ ok: true, created: false });
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('approved');
    expect(sent).toHaveLength(0); // nothing changed in the answer: no emails

    const changed = await request(app).post('/api/ff/rsvp').send({ ...guest, attending: false, mobile: '0821234567' });
    expect(changed.status).toBe(200);
    expect(rows[0].attending).toBe(false);
    expect(rows[0].status).toBe('approved');
    expect(sent.map((s) => s.subject)).toEqual([
      'Thank you for letting us know',
      'Friends & Family · Changed RSVP: Test Delete-Me (Not attending)',
    ]);
  });

  it('response never includes guest data', async () => {
    const app = await loadApp(fakePool().pool);
    const res = await request(app).post('/api/ff/rsvp').send(guest);
    expect(Object.keys(res.body).sort()).toEqual(['created', 'ok']);
  });

  it('an email failure does not fail the RSVP', async () => {
    const { pool, rows } = fakePool();
    const app = await loadApp(pool);
    failEmail = true;
    const res = await request(app).post('/api/ff/rsvp').send(guest);
    expect(res.status).toBe(201);
    expect(rows).toHaveLength(1);
  });

  it('organiser routes require a valid session', async () => {
    const app = await loadApp(fakePool().pool);
    expect((await request(app).post('/api/ff/organiser/list').send({})).status).toBe(401);
    expect((await request(app).post('/api/ff/organiser/list').send({ session: '9999999999999.forged' })).status).toBe(401);
    expect((await request(app).post('/api/ff/organiser/login').send({ passcode: 'wrong' })).status).toBe(401);
  });

  it('passcode attempts are rate limited', async () => {
    const app = await loadApp(fakePool().pool);
    let last = 0;
    for (let i = 0; i < 11; i += 1) {
      last = (await request(app).post('/api/ff/organiser/login').send({ passcode: 'wrong' })).status;
    }
    expect(last).toBe(429);
  });

  it('organiser can list, approve, decline, check in and undo', async () => {
    const { pool } = fakePool();
    const app = await loadApp(pool);
    await request(app).post('/api/ff/rsvp').send(guest);
    const login = await request(app).post('/api/ff/organiser/login').send({ passcode: PASSCODE });
    expect(login.status).toBe(200);
    const session = login.body.session as string;

    const list = await request(app).post('/api/ff/organiser/list').send({ session });
    expect(list.status).toBe(200);
    const id = list.body.rsvps[0].id as string;
    expect(list.body.rsvps[0]).toMatchObject({ firstName: 'Test', status: 'pending', arrived: false });

    const approve = await request(app).post('/api/ff/organiser/status').send({ session, id, status: 'approved' });
    expect(approve.body.rsvp.status).toBe('approved');
    const bad = await request(app).post('/api/ff/organiser/status').send({ session, id, status: 'vip' });
    expect(bad.status).toBe(400);

    const checkIn = await request(app).post('/api/ff/organiser/checkin').send({ session, id, arrived: true });
    expect(checkIn.body.rsvp.arrived).toBe(true);
    expect(checkIn.body.rsvp.checkedInAt).toBeTruthy();
    const undo = await request(app).post('/api/ff/organiser/checkin').send({ session, id, arrived: false });
    expect(undo.body.rsvp).toMatchObject({ arrived: false, checkedInAt: null });
  });

  it('built-in passcode fallback: rejects wrong passcodes, locked without a database URL', async () => {
    delete process.env.FF_ORGANISER_PASSCODE;
    process.env.DATABASE_URL = 'postgresql://example.invalid/db';
    let app = await loadApp(fakePool().pool);
    expect((await request(app).post('/api/ff/organiser/login').send({ passcode: 'yamguest' })).status).toBe(401);
    expect((await request(app).post('/api/ff/organiser/list').send({ session: '9999999999999.forged' })).status).toBe(401);

    vi.resetModules();
    delete process.env.DATABASE_URL;
    app = await loadApp(fakePool().pool);
    expect((await request(app).post('/api/ff/organiser/login').send({ passcode: 'anything' })).status).toBe(503);
  });

  describe('Approve / Decline emails', () => {
    async function setup(attending = true) {
      const { pool, rows } = fakePool();
      const app = await loadApp(pool);
      await request(app).post('/api/ff/rsvp').send({ ...guest, attending });
      const { session } = (await request(app).post('/api/ff/organiser/login').send({ passcode: PASSCODE })).body;
      const id = rows[0].id;
      sent = [];
      const set = (status: string) => request(app).post('/api/ff/organiser/status').send({ session, id, status });
      return { rows, set };
    }

    it('Approve emails once; pressing again never re-sends', async () => {
      const { rows, set } = await setup();
      const first = await set('approved');
      expect(first.body.email).toBe('sent');
      expect(first.body.rsvp.approvedEmailSentAt).toBeTruthy();
      expect(sent).toEqual([{ to: 'test.delete-me@example.com', subject: 'You are on the final guest list · Friends & Family' }]);
      await set('pending');
      const again = await set('approved');
      expect(again.body.email).toBe('already-sent');
      expect(sent).toHaveLength(1);
      expect(rows[0].status).toBe('approved');
    });

    it('Decline sends the warm not-on-the-list email once', async () => {
      const { set } = await setup();
      const res = await set('declined');
      expect(res.body.email).toBe('sent');
      expect(sent[0].subject).toBe('An update on your Friends & Family RSVP');
      expect((await set('declined')).body.email).toBe('already-sent');
      expect(sent).toHaveLength(1);
    });

    it('guests who said they cannot attend get no decision email', async () => {
      const { rows, set } = await setup(false);
      const res = await set('approved');
      expect(res.body.email).toBe('not-attending');
      expect(rows[0].status).toBe('approved');
      expect(sent).toHaveLength(0);
    });

    it('a failed email keeps the status and can be retried', async () => {
      const { rows, set } = await setup();
      failEmail = true;
      const res = await set('approved');
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('failed');
      expect(rows[0].status).toBe('approved');
      expect(res.body.rsvp.approvedEmailSentAt).toBeNull();
      failEmail = false;
      const retry = await set('approved');
      expect(retry.body.email).toBe('sent');
      expect(sent).toHaveLength(1);
    });
  });

  it('labels: save, no email, no status change; unknown labels rejected', async () => {
    const { pool, rows } = fakePool();
    const app = await loadApp(pool);
    await request(app).post('/api/ff/rsvp').send(guest);
    const { session } = (await request(app).post('/api/ff/organiser/login').send({ passcode: PASSCODE })).body;
    const id = rows[0].id;
    sent = [];
    const save = (body: Record<string, unknown>) =>
      request(app).post('/api/ff/organiser/labels').send({ session, id, ...body });

    const ok = await save({ tags: ['Important', 'Media', 'Media'], guestOf: 'Wez' });
    expect(ok.status).toBe(200);
    expect(ok.body.rsvp.tags).toEqual(['Media', 'Important']); // fixed order, no duplicates
    expect(ok.body.rsvp.guestOf).toBe('Wez');
    expect(ok.body.rsvp.status).toBe('pending');
    expect(sent).toHaveLength(0);

    expect((await save({ tags: ['VIP'], guestOf: null })).status).toBe(400);
    expect((await save({ tags: [], guestOf: 'Somebody' })).status).toBe(400);
    expect((await save({ tags: 'Media', guestOf: null })).status).toBe(400);

    const cleared = await save({ tags: [], guestOf: null });
    expect(cleared.body.rsvp).toMatchObject({ tags: [], guestOf: null });
    expect((await request(app).post('/api/ff/organiser/labels').send({ id, tags: [], guestOf: null })).status).toBe(401);
  });

  describe('organiser edit / add / delete', () => {
    async function setup() {
      const { pool, rows } = fakePool();
      const app = await loadApp(pool);
      await request(app).post('/api/ff/rsvp').send(guest);
      await request(app).post('/api/ff/rsvp').send({ ...guest, firstName: 'Other', email: 'other@example.com' });
      const { session } = (await request(app).post('/api/ff/organiser/login').send({ passcode: PASSCODE })).body;
      sent = [];
      const call = (path: string, body: Record<string, unknown>) =>
        request(app).post(`/api/ff/organiser/${path}`).send({ session, ...body });
      return { app, rows, call };
    }
    const edited = { firstName: 'Edited', surname: 'Name', mobile: '060 000 0099', email: 'NEW@Example.com', attending: false };

    it('edit: validates, normalises, keeps status/labels, never emails', async () => {
      const { rows, call } = await setup();
      const target = rows[0];
      Object.assign(target, { status: 'approved', tags: ['Media'], guest_of: 'Wez', approved_email_sent_at: new Date() });
      const bad = await call('edit', { id: target.id, ...edited, mobile: '012 345 6789' });
      expect(bad.status).toBe(400);
      expect(bad.body.fields.mobile).toBeTruthy();
      const res = await call('edit', { id: target.id, ...edited });
      expect(res.status).toBe(200);
      expect(res.body.rsvp).toMatchObject({
        firstName: 'Edited', mobile: '+27600000099', email: 'new@example.com', attending: false,
        status: 'approved', tags: ['Media'], guestOf: 'Wez',
      });
      expect(res.body.rsvp.approvedEmailSentAt).toBeTruthy();
      expect(sent).toHaveLength(0);
    });

    it('edit: duplicate email is refused and nothing changes', async () => {
      const { rows, call } = await setup();
      const res = await call('edit', { id: rows[0].id, ...edited, email: 'OTHER@example.com' });
      expect(res.status).toBe(409);
      expect(res.body.fields.email).toBe('Another guest already uses this email address.');
      expect(rows[0].first_name).toBe('Test');
    });

    it('add: creates a Pending guest, refuses duplicates, never emails', async () => {
      const { rows, call } = await setup();
      const res = await call('create', { ...edited, email: 'added@example.com', attending: true });
      expect(res.status).toBe(201);
      expect(res.body.rsvp).toMatchObject({ firstName: 'Edited', status: 'pending', email: 'added@example.com' });
      expect(rows).toHaveLength(3);
      expect((await call('create', { ...edited, email: 'other@example.com' })).status).toBe(409);
      expect((await call('create', { firstName: 'x' })).status).toBe(400);
      expect(sent).toHaveLength(0);
    });

    it('delete: removes the RSVP, never emails', async () => {
      const { rows, call } = await setup();
      const id = rows[0].id;
      expect((await call('delete', { id })).body).toEqual({ ok: true, id });
      expect(rows.map((r) => r.id)).not.toContain(id);
      expect((await call('delete', { id })).status).toBe(404);
      expect((await call('delete', { id: 'not-a-uuid' })).status).toBe(400);
      expect(sent).toHaveLength(0);
    });

    it('all three require an organiser session', async () => {
      const { app, rows } = await setup();
      const id = rows[0].id;
      for (const [path, body] of [['edit', { id, ...edited }], ['create', edited], ['delete', { id }]] as const) {
        expect((await request(app).post(`/api/ff/organiser/${path}`).send(body)).status).toBe(401);
      }
      expect(rows).toHaveLength(2);
    });
  });

  it('day-before test email: one address only, session required, has image attachment', async () => {
    const app = await loadApp(fakePool().pool);
    const { session } = (await request(app).post('/api/ff/organiser/login').send({ passcode: PASSCODE })).body;
    sent = [];
    expect((await request(app).post('/api/ff/organiser/day-before-test').send({ to: 'x@example.com' })).status).toBe(401);
    expect((await request(app).post('/api/ff/organiser/day-before-test').send({ session, to: 'nope' })).status).toBe(400);
    const res = await request(app).post('/api/ff/organiser/day-before-test').send({ session, to: 'Me@Example.com' });
    expect(res.body).toEqual({ ok: true, email: 'sent' });
    expect(sent).toEqual([{ to: 'me@example.com', subject: 'See you tomorrow · Friends & Family' }]);
    const { renderFfDayBeforeEmail } = await import('../friendsFamilyEmails.js');
    const email = renderFfDayBeforeEmail('<b>Thandi</b>');
    expect(email.html).toContain('styling-direction.jpg');
    expect(email.html).toContain('&lt;b&gt;Thandi');
    expect(email.attachments?.[0].filename).toBe('Friends-Family-Styling-Direction.jpg');
  });

  it('changing the passcode ends existing sessions', async () => {
    const app = await loadApp(fakePool().pool);
    const { session } = (await request(app).post('/api/ff/organiser/login').send({ passcode: PASSCODE })).body;
    process.env.FF_ORGANISER_PASSCODE = 'a-new-passcode';
    expect((await request(app).post('/api/ff/organiser/list').send({ session })).status).toBe(401);
  });
});
