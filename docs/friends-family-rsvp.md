# Friends & Family RSVP (Sunday, 22 November 2026)

An invitation-only RSVP page for **You&Me with Martell × Kaya 959 — Friends & Family**, plus a passcode-protected guest list for hosts and door staff.

## What was added

| Piece | Where |
|---|---|
| Guest invite page (secret link) | `/ff/<token>` → `src/friendsFamily/FfInvitePage.tsx`, `FfRsvpForm.tsx` |
| "By invitation only" gate | `/ff` and any wrong token (same file, `FfInvitationOnly`) |
| Organiser / door page | `/ff/organiser` → `src/friendsFamily/FfOrganiserPage.tsx`, `organiserData.ts` |
| All page copy and event details | `src/friendsFamily/content.ts` |
| Page-only styles, fonts, background, motion | `src/friendsFamily/ff.css` (lazy-loaded: no effect on other pages) |
| Images | `public/images/friends-family/` (wordmark trimmed from `public/sponsors/youandme brown .png`) |
| API routes, table, rate limits | `server/friendsFamily.ts` |
| Token / passcode / session checks | `server/friendsFamilyAuth.ts` |
| Event details + server validation | `server/friendsFamilyMeta.ts` |
| Guest + host emails | `server/friendsFamilyEmails.ts` |
| Tests | `server/__tests__/friendsFamily.test.ts`, `src/friendsFamily/friendsFamily.test.ts` |

Small edits to shared files: `src/routes.tsx` (3 lazy routes; analytics off on `/ff*`), `src/lib/seo.ts` (noindex, canonical without token), `index.html` (GA `config` skipped on `/ff*` so the token never reaches Google Analytics), `public/robots.txt` (`Disallow: /ff`), `server/app.ts`, `server/index.ts`, `scripts/migrate-db.ts` (register routes + table).

## How privacy works

- The guest page only renders after the API confirms the token (`POST /api/ff/invite`). Wrong/missing token → "By invitation only", no event details, no form.
- `POST /api/ff/rsvp` also requires the token. The token lives only in Railway (`FF_INVITE_TOKEN`), never in the frontend build.
- Anyone holding the link can RSVP (forwarding allowed). Every RSVP lands as **Pending**; hosts approve or decline.
- `noindex,nofollow`, not in the sitemap, disallowed in robots.txt, no Google/Vercel analytics on `/ff*`.
- Organiser access: shared passcode checked on the server → signed 14-hour session. Passcode attempts are limited to 10 per 15 minutes per IP.

## Database

New table `friends_family_rsvps` (created automatically on API start and by `npm run db:migrate`, idempotent; existing tables untouched):
`id, first_name, surname, mobile (+27…), email (unique, lower-case), attending, status (pending|approved|declined), arrived, checked_in_at, created_at, updated_at`.

A separate table was used because the existing RSVP tables store a single `full_name` and are one-RSVP-per-email *across* their forms; mixing would have blocked guests who already RSVP'd to other editions.

## Emails (Resend, existing `RESEND_API_KEY` / `RESEND_FROM_EMAIL`)

- Guest confirmation (attending / not attending) on the first RSVP and whenever the answer changes. Re-sending with the same answer sends nothing.
- Host notification to `RSVP_NOTIFY_EMAIL` on every new RSVP and every changed answer.
- An email failure never fails the RSVP (logged as `[ff-rsvp] … email failed (RSVP saved)`).

## Environment variables (Railway API service)

| Variable | New? | Notes |
|---|---|---|
| `FF_INVITE_TOKEN` | **New** | 16+ URL-safe characters (letters, digits, `-`, `_`; no dots). The invite link is `https://www.youandmeafrica.com/ff/<token>` |
| `FF_ORGANISER_PASSCODE` | **New** | Shared by hosts and door staff |
| `FF_SESSION_SECRET` | New, optional | Extra signing key; changing it signs everyone out |
| `RSVP_NOTIFY_EMAIL` | Existing | Must be set for host notifications |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Existing | Guest + host emails |
| `FRONTEND_URL` / `ALLOWED_ORIGINS` | Existing | Links in emails; RSVP origin check |

Nothing new on Vercel.

## Rotating the link or passcode

- **New invite link:** change `FF_INVITE_TOKEN` on Railway and redeploy/restart. The old link immediately shows "By invitation only". Existing RSVPs are kept.
- **New passcode:** change `FF_ORGANISER_PASSCODE`; everyone signed in is signed out.

## Open items

1. Robby to approve the confirmation email wording (spec 3.8) before the link goes out.
2. Link previews (WhatsApp etc.) show the site's general title/image, because the site is a single-page app; the page itself is correct once opened.
3. The site-wide RSVP rate limiter (`RATE_LIMIT_ENABLED`) is **off** on production by default (existing TODO). The Friends & Family routes have their own always-on limits.
4. `npm run lint` fails on an existing, unrelated error in `src/TicketPage.tsx` (unused `Navigate` import) — present on `main` before this work.
5. Design tokens are plain CSS custom properties scoped under `.ff-root` (`--ff-ink`, …) rather than Tailwind `@theme` tokens, so nothing global changes.
6. Phone background: spec 7.3 asked for `cover` + `80% top`; the leaves then covered form labels while scrolling at 320–390px, so the image is scaled to 118% height and pinned right (spec 7.6).

## Test entries

All testing used a throwaway in-memory Postgres on Robby's PC (PGlite); **nothing reached Railway**. Fake entries used, for the record: `Test Delete-Me`, `test.delete-me+1@example.com`, `+2@`, `+3@`, mobiles `+27 60 000 0001–0003`. No real emails were sent (no Resend key locally).
