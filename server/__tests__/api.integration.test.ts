import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../rsvpSessions.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../rsvpSessions.js')>();
  return {
    ...actual,
    isRsvpSessionFull: () => false,
  };
});

const noPool = () => null;

describe('API integration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_PRIVATE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function loadApp() {
    const { createApp } = await import('../app.js');
    return createApp({ getPoolFn: noPool });
  }

  it('GET /api/health returns ok shape', async () => {
    const app = await loadApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: false,
      database: 'not_configured',
    });
  });

  it('POST /api/rsvp rejects missing body fields', async () => {
    const app = await loadApp();
    const res = await request(app).post('/api/rsvp').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Full name is required');
  });

  it('POST /api/rsvp returns 503 when database is not configured', async () => {
    const app = await loadApp();
    const res = await request(app)
      .post('/api/rsvp')
      .send({
        fullName: 'Test Guest',
        email: 'guest@example.com',
        session: 'harvest-table',
      });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Database not configured');
  });

  it('POST /api/rsvp rejects unknown origin in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = 'https://www.youandmeafrica.com';

    const app = await loadApp();
    const res = await request(app)
      .post('/api/rsvp')
      .set('Origin', 'https://evil.example')
      .send({
        fullName: 'Test Guest',
        email: 'guest@example.com',
        session: 'harvest-table',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('POST /api/rsvp allows configured origin in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = 'https://www.youandmeafrica.com';

    const app = await loadApp();
    const res = await request(app)
      .post('/api/rsvp')
      .set('Origin', 'https://www.youandmeafrica.com')
      .send({
        fullName: 'Test Guest',
        email: 'guest@example.com',
        session: 'harvest-table',
      });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Database not configured');
  });

  it('POST /api/rsvp returns 429 after rate limit exceeded', async () => {
    process.env.RATE_LIMIT_ENABLED = 'true';
    process.env.RSVP_RATE_LIMIT_MAX = '2';
    process.env.RSVP_RATE_LIMIT_WINDOW_MS = '60000';

    vi.resetModules();
    const { createApp } = await import('../app.js');
    const app = createApp({ getPoolFn: noPool });

    const payload = {
      fullName: 'Test Guest',
      email: 'guest@example.com',
      session: 'harvest-table',
    };

    await request(app).post('/api/rsvp').send(payload);
    await request(app).post('/api/rsvp').send(payload);
    const res = await request(app).post('/api/rsvp').send(payload);

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too many requests');
  });

  it('POST /api/rsvp/third rejects missing body fields', async () => {
    const app = await loadApp();
    const res = await request(app).post('/api/rsvp/third').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Full name is required');
  });

  it('POST /api/rsvp/third returns 503 when database is not configured', async () => {
    const app = await loadApp();
    const res = await request(app)
      .post('/api/rsvp/third')
      .send({
        fullName: 'Test Guest',
        email: 'guest@example.com',
      });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Database not configured');
  });
});
