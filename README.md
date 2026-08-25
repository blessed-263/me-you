# You & Me Africa — event site

Vite + React + TypeScript + Tailwind CSS, with a small **Express + PostgreSQL** API for **secret RSVP** forms (Resend emails).

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- PostgreSQL (e.g. [Railway Postgres](https://railway.app/))

## Environment

Copy [.env.example](.env.example) to `.env` (or edit the included `.env`) and set:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes (for RSVP) | Postgres connection string (Railway provides this). |
| `API_PORT` | Dev only | API listen port; default `3001`. Vite proxies `/api` here. |
| `RESEND_API_KEY` | For RSVP emails | From [Resend](https://resend.com/api-keys). |
| `RESEND_FROM_EMAIL` | For RSVP emails | Verified sender, e.g. `You & Me <hello@yourdomain.com>`. |
| `RSVP_NOTIFY_EMAIL` | Optional | Inbox that receives a copy of each new RSVP. |

On **Railway**, add the same `DATABASE_URL` to your **web/API** service (reference the variable from your Postgres plugin if offered). On every deploy/restart the API runs an **idempotent migration** that:

- Ensures `rsvp_submissions` exists
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

This runs the API (watch) and Vite together. Open the URL Vite prints (port **3000**). RSVP submits go to `/api/rsvp` via the dev proxy.

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
| `FRONTEND_URL` | `https://www.youandmeafrica.com` (email image URLs) |
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
| `npm run lint` | ESLint + TypeScript check (`eslint . && tsc --noEmit`) |
| `npm run lint:fix` | Auto-fix ESLint issues |

## Private RSVP (secret links)

The RSVP forms are **not linked** on the public site. Send each URL only to guests for that experience:

| URL | Session | Time |
| ----- | ------- | ---- |
| `/harvest-table` | Harvest Table | 11:00 – 14:30 |
| `/after-party-lunch` | The After Lunch Party | 15:00 – 20:00 |

Rules: **one guest per RSVP** (no plus-ones), **no notes field**, **one RSVP per email** (cannot register twice, including across both links).

1. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env` (and Railway variables in production).
2. Submissions are stored in Postgres (`rsvp_submissions`). Guests receive a session-specific confirmation email; `RSVP_NOTIFY_EMAIL` gets an admin copy if set.

### Export all RSVPs (Excel)

One workbook with an **Analysis** sheet plus separate tabs for each guest list:

```bash
npm run export:rsvps-excel
```

Writes `you-and-me-all-rsvps.xlsx` in the project root:

| Sheet | Contents |
| ----- | -------- |
| **Analysis** | Edition/session counts, totals, ticket summary |
| **Harvest Table** | Full guest list (Session 1) |
| **After Lunch Party** | Full guest list (Session 2) |
| **June Gathering** | June RSVP list |
| **All RSVPs** | Combined list with event + session columns |

Requires `DATABASE_URL`. First-edition (April) names are not in Postgres — Analysis includes archived counts only.

## Ticket storefront & organizer (mock or AmpEx)

Set `VITE_USE_MOCK_DATA` in `.env`:

| Value | Behaviour |
| ----- | --------- |
| `true` (default) | Client-side mock events, checkout, and organizer demo data |
| `false` | Live AmpEx/Medusa APIs for tickets, Paystack checkout, and organizer dashboards |

### AmpEx environment variables

| Variable | Required (live) | Description |
| -------- | --------------- | ----------- |
| `VITE_USE_MOCK_DATA` | No | `true` = mocks; `false` = AmpEx |
| `VITE_MEDUSA_API_URL` | Yes | Medusa backend, e.g. `http://localhost:9000` |
| `VITE_MEDUSA_PUBLISHABLE_KEY` | Yes | Publishable API key on all `/store/*` calls |
| `VITE_MEDUSA_REGION_ID` | Recommended | Skips region lookup at checkout |
| `VITE_YME_ORGANIZER_ID` | Yes | Filters public events to You & Me organizer |
| `VITE_AMPEX_FRONTEND_URL` | Yes (live) | AmpEx organizer portal link for “Manage events on AmpEx” |

`VITE_API_URL` remains for the RSVP Express API only (separate from Medusa).

In dev, Vite proxies `/store` → `VITE_MEDUSA_API_URL`.

### Event management (ampex.store)

**Create, edit, publish events, and upload images** on **[ampex.store](https://www.ampex.store)** via [ampex-frontend](../ampex-frontend) — not in me-you.

| Concern | Where |
| ------- | ----- |
| Event create / edit UI | ampex-frontend (`CreateEditEventPage`, organizer settings) |
| Image uploads | ampex-frontend → Medusa `POST /store/upload` |
| Event publish | ampex-frontend → Medusa `POST /admin/events` |
| List / sell / report | me-you (published events for `VITE_YME_ORGANIZER_ID`) |

Organizer sidebar **Manage events on AmpEx** opens `VITE_AMPEX_FRONTEND_URL` (see [`src/lib/organizerApi.ts`](src/lib/organizerApi.ts)). me-you does not implement event upload endpoints.

### Ticket URLs

| URL | Step |
| ----- | ------ |
| `/tickets` | Event landing (or edition picker when multiple events) |
| `/tickets/login` | Attendee sign-in / register |
| `/tickets/pick` | Choose ticket types and quantities |
| `/tickets/checkout` | Buyer details + holder names |
| `/tickets/payment` | Mock card UI or Paystack redirect |
| `/tickets/payment/callback` | Paystack return → finalize order |
| `/tickets/success` | Order confirmation |
| `/tickets/my-tickets` | Purchased tickets (requires sign-in) |

### Organizer URLs

| URL | Screen |
| ----- | ------ |
| `/organizer/login` | Organizer sign-in |
| `/organizer/dashboard` | Stats overview |
| `/organizer/orders` | Order list + detail |
| `/organizer/tickets` | Issued tickets |
| `/organizer/attendees` | Guest list + CSV export |
| `/organizer/revenue` | Revenue breakdown |

Sidebar includes **Manage events on AmpEx** → ampex-frontend (no event upload in me-you).

### Smoke test checklist (live mode)

Before setting `VITE_USE_MOCK_DATA=false`:

1. **You & Me organizer** exists in AmpEx with known `organizer_id` → set `VITE_YME_ORGANIZER_ID`
2. At least one **published** event with ticket variants (created via ampex-frontend)
3. Publishable API key + region id configured
4. Paystack **Live Callback URL** (dashboard): set to `https://www.ampex.store/payment-callback` as the default fallback. Each storefront also sends its own `callback_url` per checkout (`youandmeafrica.com/tickets/payment/callback`, etc.) — add those origins to AmpEx `STORE_CORS` / `ALLOWED_ORIGINS`.
5. me-you origin in AmpEx backend env: `STORE_CORS` and/or `ALLOWED_ORIGINS` (include `https://www.youandmeafrica.com` and dev localhost origins)
6. `FRONTEND_URL` on AmpEx backend set to your primary storefront (email links, Paystack fallback callback)
7. Medusa backend running (e.g. port 9000)

**Local smoke test:**

```bash
# Terminal 1 — AmpEx backend (:9000)
# Terminal 2 — me-you
cd me-you
# .env: VITE_USE_MOCK_DATA=false, VITE_MEDUSA_* , VITE_YME_ORGANIZER_ID
npm run dev
```

- [ ] `/tickets` loads published events from API
- [ ] Register / login attendee; verify email flow if required
- [ ] Add tickets → checkout → Paystack test payment → callback → success
- [ ] `/tickets/my-tickets` shows issued tickets
- [ ] Organizer login → dashboard/orders scoped to selected event
- [ ] “Manage events on AmpEx” opens ampex-frontend

Mock data modules: [`src/lib/mockOrganizer.ts`](src/lib/mockOrganizer.ts), [`src/lib/dataSource.ts`](src/lib/dataSource.ts).

## API

- `POST /api/rsvp` — JSON `{ "fullName", "email", "session", "phone?" }` where `session` is `harvest-table` or `after-party-lunch` → `201` saved, `200` if that email already RSVP'd, `400` validation error, `403` unknown origin (production), `429` rate limited, `503` if DB not configured.
- `POST /api/rsvp/june` — June RSVP form (same protections).
- `GET /api/health` — `{ "ok": true }`.

RSVP POST routes in production require `Origin` or `Referer` from `ALLOWED_ORIGINS` / `FRONTEND_URL`. Rate limit defaults: **10 requests / 15 min / IP** (override with `RSVP_RATE_LIMIT_MAX`, `RSVP_RATE_LIMIT_WINDOW_MS`).
