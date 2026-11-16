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
    process.env = { ...originalEnv, FF_INVITE_TOKEN: TOKEN, FF_ORGANISER_PASSCODE: PASSCODE };
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

  it('changing the passcode ends existing sessions', async () => {
    const app = await loadApp(fakePool().pool);
    const { session } = (await request(app).post('/api/ff/organiser/login').send({ passcode: PASSCODE })).body;
    process.env.FF_ORGANISER_PASSCODE = 'a-new-passcode';
    expect((await request(app).post('/api/ff/organiser/list').send({ session })).status).toBe(401);
  });
});
