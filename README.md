# You & Me Africa — event site

Vite + React + TypeScript + Tailwind CSS, with a small **Express + PostgreSQL** API for newsletter signups and a **secret RSVP** form (Resend emails).

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- PostgreSQL (e.g. [Railway Postgres](https://railway.app/))

## Environment

Copy [.env.example](.env.example) to `.env` (or edit the included `.env`) and set:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes (for newsletter & RSVP) | Postgres connection string (Railway provides this). |
| `API_PORT` | Dev only | API listen port; default `3001`. Vite proxies `/api` here. |
| `RESEND_API_KEY` | For RSVP emails | From [Resend](https://resend.com/api-keys). |
| `RESEND_FROM_EMAIL` | For RSVP emails | Verified sender, e.g. `You & Me <hello@yourdomain.com>`. |
| `RSVP_NOTIFY_EMAIL` | Optional | Inbox that receives a copy of each new RSVP. |

On **Railway**, add the same `DATABASE_URL` to your **web/API** service (reference the variable from your Postgres plugin if offered). On every deploy/restart the API runs an **idempotent migration** that:

- Ensures `newsletter_subscribers` and `rsvp_submissions` exist
- Adds `session` on RSVPs (`harvest-table` or `after-party-lunch`)
- Renames legacy session `the-after-party` → `after-party-lunch`
- Enforces **one RSVP per email** (unique index on `lower(email)`); duplicate rows from older per-session rules are removed (earliest kept)
- Drops the old per-email+session unique index if present

To run migrations manually (e.g. against Railway from your machine with `DATABASE_URL` in `.env`):

```bash
npm run db:migrate
```

Check Railway deploy logs for `[rsvp] Table rsvp_submissions is ready`.

## Local development

```bash
npm install
```

Set `DATABASE_URL` in `.env`, then:

```bash
npm run dev
```

This runs the API (watch) and Vite together. Open the URL Vite prints (port **3000**). Submits go to `/api/newsletter` via the dev proxy.

Frontend only (no API):

```bash
npm run dev:vite
```

## Production build & run

```bash
npm install
npm run build
npm start
```

`npm start` serves the built SPA from `dist/` and handles `/api/*` on the same port (`cross-env` sets `NODE_ENV=production`). Railway sets `PORT` automatically.

## Deploy: Vercel (frontend) + Railway (backend)

Use **Vercel** for the React site and **Railway** for the API, Postgres, and Resend.

### Railway (API + database)

1. Create a **PostgreSQL** plugin on Railway.
2. Create a **new service** from this GitHub repo (same repo as Vercel).
3. Railway reads `railway.toml` automatically:
   - **Build:** `npm run build:server`
   - **Start:** `npm start` (API only — does not serve the Vercel frontend)
4. **Variables** on the Railway service:

| Variable | Example |
| -------- | ------- |
| `DATABASE_URL` | Reference from Postgres plugin |
| `ALLOWED_ORIGINS` | `https://your-site.vercel.app,https://www.youandmeafrica.com` |
| `RESEND_API_KEY` | From Resend |
| `RESEND_FROM_EMAIL` | `You & Me <rsvp@events.youandmeafrica.com>` |
| `RSVP_NOTIFY_EMAIL` | Your inbox |

5. Copy the Railway public URL (e.g. `https://me-you-production.up.railway.app`).
6. Health check: `GET /api/health` → `{ "ok": true, "database": "connected" }`.

**If RSVP returns `Database not configured`:** `DATABASE_URL` is missing on the **API service** (not Vercel). In Railway → your **API/web service** → **Variables** → **Add variable** → **Add reference** → choose the Postgres plugin → select `DATABASE_URL`. Redeploy. The API also accepts `DATABASE_PRIVATE_URL` if you reference that instead. Deploy logs should show `[db] Using DATABASE_URL for Postgres.` — if you see `No database URL found`, the variable is still not on that service.

### Vercel (frontend)

1. Import the same repo on [vercel.com](https://vercel.com).
2. Framework: **Vite** (or use the included `vercel.json`).
3. **Environment variable** (Production + Preview):

| Variable | Value |
| -------- | ----- |
| `VITE_API_URL` | Your Railway URL (no trailing slash) |

4. Deploy. The site builds with `npm run build:web` and does **not** need `DATABASE_URL` or Resend keys on Vercel.

5. Private RSVP links (send separately — do not mix guest lists):
   - `https://your-vercel-domain/harvest-table` — Harvest Table (11:00–14:30)
   - `https://your-vercel-domain/after-party-lunch` — The After Lunch Party (15:00–20:00)

### Verify split setup

- Open `https://<railway-url>/api/health` → `"database": "connected"` (if `"not_configured"`, fix `DATABASE_URL` on the API service)
- Open each RSVP URL and submit a test (one guest per email; duplicate email returns already registered)
- Check Postgres / Resend / notify inbox

### All-in-one Railway (optional)

To host site + API on Railway only (no Vercel):

- **Build:** `npm run build`
- **Start:** `npm run start:full`
- Omit `VITE_API_URL` and `ALLOWED_ORIGINS` if everything is same origin.

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | API (tsx watch) + Vite with `/api` proxy |
| `npm run dev:vite` | Vite only |
| `npm run build` | `vite build` + compile `server/` to `dist-server/` |
| `npm start` | Production: static site + API |
| `npm run preview` | Vite preview of `dist/` only (no API) |
| `npm run lint` | Typecheck client (`tsc --noEmit`) |

## Private RSVP (secret links)

The RSVP forms are **not linked** on the public site. Send each URL only to guests for that experience:

| URL | Session | Time |
| ----- | ------- | ---- |
| `/harvest-table` | Harvest Table | 11:00 – 14:30 |
| `/after-party-lunch` | The After Lunch Party | 15:00 – 20:00 |

Rules: **one guest per RSVP** (no plus-ones), **no notes field**, **one RSVP per email** (cannot register twice, including across both links).

1. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env` (and Railway variables in production).
2. Submissions are stored in Postgres (`rsvp_submissions`). Guests receive a session-specific confirmation email; `RSVP_NOTIFY_EMAIL` gets an admin copy if set.

## API

- `POST /api/rsvp` — JSON `{ "fullName", "email", "session", "phone?", "dietaryNotes?" }` where `session` is `harvest-table` or `after-party-lunch` → `201` saved, `200` if that email already RSVP'd, `503` if DB not configured.
- `POST /api/newsletter` — JSON `{ "email": "you@example.com" }` → `201` new subscriber, `200` already subscribed, `400` / `503` / `500` with `{ "error": "..." }`.
- `GET /api/health` — `{ "ok": true }`.

# me-you
