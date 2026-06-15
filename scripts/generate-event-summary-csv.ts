/**
 * You & Me — RSVP + AmpEx ticket summary CSV.
 * Usage: npm run export:event-summary
 *
 * Optional .env for AmpEx ticket counts:
 *   ORGANIZER_EMAIL + ORGANIZER_PASSWORD  (organizer login)
 *   AMPEX_DATABASE_URL                    (direct Postgres query)
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { getPool, logDatabaseConfig } from '../server/db.js';
import { RSVP_SESSION_META, EVENT_DATE_SHORT } from '../server/rsvpSessions.js';

const OUT_CSV = path.join(process.cwd(), 'you-and-me-event-summary.csv');
const OUT_HTML = path.join(process.cwd(), 'you-and-me-event-summary.html');

/** First edition (April 2026) — manual figures (not in RSVP Postgres). */
const FIRST_EDITION = {
  name: 'You & Me Africa — First Edition',
  date: '26 April 2026',
  rsvps: {
    harvestTable: 108,
    afterLunch: 78,
  },
  tickets: {
    paidPurchases: 0,
    sponsor: [
      { type: 'Martell sponsors', count: 20 },
      { type: 'Stella', count: 5 },
      { type: 'Château Gateau', count: 5 },
      { type: 'Emmanuel', count: 2 },
      { type: 'Elliot and Gudman', count: 4 },
    ],
  },
} as const;

/** Second edition (31 May 2026) — manual ticket figures; RSVPs from Postgres. */
const SECOND_EDITION = {
  name: 'You & Me Africa — Second Edition',
  date: EVENT_DATE_SHORT,
  tickets: {
    paidPurchases: 13,
    sponsor: [
      { type: 'Martell', count: 12 },
      { type: 'Stella Artois', count: 5 },
      { type: 'Primedia', count: 6 },
    ],
  },
} as const;

const JUNE_GATHERING = {
  name: 'You & Me Africa — June Gathering',
  date: 'June 2026',
} as const;

const API_URL = (process.env.VITE_MEDUSA_API_URL || '').replace(/\/$/, '');
const PUBLISHABLE_KEY = process.env.VITE_MEDUSA_PUBLISHABLE_KEY || '';
const ORGANIZER_ID = process.env.VITE_YME_ORGANIZER_ID || '';
const ORGANIZER_EMAIL = process.env.ORGANIZER_EMAIL || process.env.VITE_ORGANIZER_EMAIL || '';
const ORGANIZER_PASSWORD = process.env.ORGANIZER_PASSWORD || process.env.VITE_ORGANIZER_PASSWORD || '';
const AMPEX_DATABASE_URL = process.env.AMPEX_DATABASE_URL || '';

type TicketRow = {
  eventName: string;
  eventDate: string;
  ticketType: string;
  ticketsSold: number;
  category?: 'paid' | 'sponsor';
};

function editionTicketRows(edition: {
  name: string;
  date: string;
  tickets: { paidPurchases: number; sponsor: readonly { type: string; count: number }[] };
}): TicketRow[] {
  const { name, date, tickets } = edition;
  const rows: TicketRow[] = [
    {
      eventName: name,
      eventDate: date,
      ticketType: 'Paid ticket purchases',
      ticketsSold: tickets.paidPurchases,
      category: 'paid',
    },
  ];
  for (const s of tickets.sponsor) {
    rows.push({
      eventName: name,
      eventDate: date,
      ticketType: `Sponsor — ${s.type}`,
      ticketsSold: s.count,
      category: 'sponsor',
    });
  }
  return rows;
}

function ticketTotals(rows: TicketRow[]) {
  let paid = 0;
  let sponsor = 0;
  for (const row of rows) {
    if (row.category === 'sponsor') sponsor += row.ticketsSold;
    else paid += row.ticketsSold;
  }
  return { paid, sponsor, all: paid + sponsor };
}

function appendTicketSection(
  lines: string[][],
  edition: { name: string; date: string },
  rows: TicketRow[],
) {
  lines.push(
    [''],
    [`TICKETS — ${edition.name}`, edition.date],
    ['Ticket Type', 'Count'],
  );
  for (const row of rows) {
    lines.push([row.ticketType, String(row.ticketsSold)]);
  }
  const totals = ticketTotals(rows);
  lines.push(
    [''],
    [`${edition.name} — paid`, String(totals.paid)],
    [`${edition.name} — sponsor / comp`, String(totals.sponsor)],
    [`${edition.name} — all tickets`, String(totals.all)],
  );
  return totals;
}

type RsvpSection = {
  name: string;
  date: string;
  rows: { session: string; count: number }[];
  total: number;
};

type TicketSection = {
  name: string;
  date: string;
  rows: TicketRow[];
  totals: ReturnType<typeof ticketTotals>;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSummaryHtml(data: {
  generated: string;
  rsvpSections: RsvpSection[];
  ticketSections: TicketSection[];
  totalRsvps: number;
  grandPaid: number;
  grandSponsor: number;
}): string {
  const { generated, rsvpSections, ticketSections, totalRsvps, grandPaid, grandSponsor } = data;
  const grandAll = grandPaid + grandSponsor;

  const rsvpTable = (section: RsvpSection) => `
    <table>
      <thead>
        <tr><th>Session</th><th class="num">RSVPs</th></tr>
      </thead>
      <tbody>
        ${section.rows
          .map(
            (r) =>
              `<tr><td>${escapeHtml(r.session)}</td><td class="num">${r.count}</td></tr>`,
          )
          .join('')}
        <tr class="subtotal"><td>Event total</td><td class="num">${section.total}</td></tr>
      </tbody>
    </table>`;

  const ticketTable = (section: TicketSection) => `
    <table>
      <thead>
        <tr><th>Ticket type</th><th class="num">Count</th></tr>
      </thead>
      <tbody>
        ${section.rows
          .map((r) => {
            const cls = r.category === 'sponsor' ? 'sponsor' : r.ticketsSold > 0 ? 'paid' : '';
            return `<tr class="${cls}"><td>${escapeHtml(r.ticketType)}</td><td class="num">${r.ticketsSold}</td></tr>`;
          })
          .join('')}
        <tr class="subtotal"><td>Paid purchases</td><td class="num">${section.totals.paid}</td></tr>
        <tr class="subtotal"><td>Sponsor / comp</td><td class="num">${section.totals.sponsor}</td></tr>
        <tr class="total"><td>All tickets</td><td class="num">${section.totals.all}</td></tr>
      </tbody>
    </table>`;

  const editionPages = rsvpSections
    .map((rsvp) => {
      const tickets = ticketSections.find((t) => t.name === rsvp.name);
      return `
  <section class="page edition-page">
    <header class="edition-header">
      <p class="edition-label">Edition</p>
      <h2>${escapeHtml(rsvp.name)}</h2>
      <p class="edition-date">${escapeHtml(rsvp.date)}</p>
    </header>
    <div class="two-col">
      <div class="block">
        <h3>RSVPs</h3>
        ${rsvpTable(rsvp)}
      </div>
      ${
        tickets
          ? `<div class="block">
        <h3>Tickets</h3>
        ${ticketTable(tickets)}
      </div>`
          : `<div class="block block--muted"><h3>Tickets</h3><p class="empty">No ticket data for this event.</p></div>`
      }
    </div>
    <footer class="page-footer">You &amp; Me Africa · Event summary</footer>
  </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en-ZA">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You &amp; Me Africa — Event Summary</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: #e8e4dc;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto 12px;
      padding: 22mm 18mm 16mm;
      background: #f6f1e8;
      box-shadow: 0 4px 24px rgba(26,26,26,.08);
      page-break-after: always;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    @media print {
      body { background: white; }
      .page { margin: 0; box-shadow: none; width: auto; min-height: auto; }
    }
    .cover {
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(165deg, #f6f1e8 0%, #eee6d8 50%, #e6dccd 100%);
    }
    .cover h1 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 2rem;
      font-weight: 500;
      margin: 0 0 .5rem;
      letter-spacing: -.02em;
    }
    .cover .tagline {
      font-size: .75rem;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: #5a5a40;
      margin-bottom: 2rem;
    }
    .cover .meta {
      font-size: .9rem;
      color: #6b6b5d;
    }
    .edition-header {
      border-bottom: 2px solid #5a5a40;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .edition-label {
      font-size: .65rem;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: #5a5a40;
      margin: 0 0 .35rem;
    }
    .edition-header h2 {
      font-family: Georgia, serif;
      font-size: 1.45rem;
      font-weight: 500;
      margin: 0;
      line-height: 1.25;
    }
    .edition-date {
      margin: .4rem 0 0;
      color: #6b6b5d;
      font-size: .95rem;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      flex: 1;
    }
    @media (max-width: 700px) {
      .page { width: 100%; padding: 1.5rem; }
      .two-col { grid-template-columns: 1fr; }
    }
    h3 {
      font-size: .7rem;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: #5a5a40;
      margin: 0 0 .75rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: .92rem;
    }
    th, td {
      padding: .55rem .65rem;
      text-align: left;
      border-bottom: 1px solid #dcd8cf;
    }
    th {
      font-size: .65rem;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #6b6b5d;
      font-weight: 600;
      background: rgba(255,255,255,.35);
    }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    tr.subtotal td { font-weight: 600; background: rgba(255,255,255,.25); }
    tr.total td { font-weight: 700; background: rgba(90,90,64,.12); border-top: 2px solid #5a5a40; }
    tr.sponsor td:first-child { padding-left: 1rem; color: #4a4a38; }
    tr.paid td:first-child { font-weight: 500; }
    .block--muted .empty { color: #6b6b5d; font-style: italic; margin: 0; }
    .page-footer {
      margin-top: auto;
      padding-top: 1.5rem;
      font-size: .65rem;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #9a9588;
      text-align: center;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }
    .stat-card {
      background: rgba(255,255,255,.45);
      border: 1px solid #dcd8cf;
      padding: 1.25rem;
      border-radius: 4px;
    }
    .stat-card .label {
      font-size: .65rem;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: #6b6b5d;
      margin-bottom: .35rem;
    }
    .stat-card .value {
      font-family: Georgia, serif;
      font-size: 2rem;
      font-weight: 500;
      color: #1a1a1a;
    }
    .stat-card--accent { border-color: #5a5a40; background: rgba(90,90,64,.08); }
    .overview-table { margin-top: 1.5rem; }
  </style>
</head>
<body>
  <section class="page cover">
    <p class="tagline">Event summary report</p>
    <h1>You &amp; Me Africa</h1>
    <p class="meta">Generated ${escapeHtml(generated)}</p>
    <footer class="page-footer" style="margin-top:3rem;">RSVPs &amp; tickets by edition</footer>
  </section>

  ${editionPages}

  <section class="page">
    <header class="edition-header">
      <p class="edition-label">Overview</p>
      <h2>All events — totals</h2>
    </header>
    <div class="summary-grid">
      <div class="stat-card stat-card--accent">
        <div class="label">Total RSVPs</div>
        <div class="value">${totalRsvps}</div>
      </div>
      <div class="stat-card">
        <div class="label">Paid tickets</div>
        <div class="value">${grandPaid}</div>
      </div>
      <div class="stat-card">
        <div class="label">Sponsor / comp</div>
        <div class="value">${grandSponsor}</div>
      </div>
      <div class="stat-card stat-card--accent">
        <div class="label">All tickets</div>
        <div class="value">${grandAll}</div>
      </div>
    </div>
    <div class="overview-table">
      <h3>RSVPs by edition</h3>
      <table>
        <thead><tr><th>Event</th><th>Date</th><th class="num">RSVPs</th></tr></thead>
        <tbody>
          ${rsvpSections
            .map(
              (s) =>
                `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.date)}</td><td class="num">${s.total}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="overview-table">
      <h3>Tickets by edition</h3>
      <table>
        <thead><tr><th>Event</th><th class="num">Paid</th><th class="num">Sponsor</th><th class="num">Total</th></tr></thead>
        <tbody>
          ${ticketSections
            .map(
              (s) =>
                `<tr><td>${escapeHtml(s.name)}</td><td class="num">${s.totals.paid}</td><td class="num">${s.totals.sponsor}</td><td class="num">${s.totals.all}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <footer class="page-footer">You &amp; Me Africa · Event summary</footer>
  </section>
</body>
</html>`;
}

function firstEditionTicketRows(): TicketRow[] {
  return editionTicketRows(FIRST_EDITION);
}

function secondEditionTicketRows(): TicketRow[] {
  return editionTicketRows(SECOND_EDITION);
}

function esc(v: unknown): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function formatDate(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function sessionLabel(session: string): string {
  if (session === 'harvest-table') return `${RSVP_SESSION_META['harvest-table'].title} (Session 1)`;
  if (session === 'after-party-lunch') return `${RSVP_SESSION_META['after-party-lunch'].title} (Session 2)`;
  if (session === 'the-after-party') return `${RSVP_SESSION_META['after-party-lunch'].title} (Session 2)`;
  return session;
}

async function fetchRsvpSummary() {
  const pool = getPool();
  if (!pool) throw new Error('DATABASE_URL not set');

  const may = await pool.query<{ session: string; rsvps: number }>(`
    SELECT session, COUNT(*)::int AS rsvps
    FROM rsvp_submissions
    GROUP BY session
    ORDER BY session
  `);

  let june: { rsvps: number } | null = null;
  try {
    const j = await pool.query<{ rsvps: number }>(`
      SELECT COUNT(*)::int AS rsvps
      FROM june_rsvps
    `);
    june = j.rows[0] ?? null;
  } catch {
    june = null;
  }

  await pool.end();
  return { may: may.rows, june };
}

async function fetchStoreJson<T>(storePath: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers as HeadersInit);
  if (PUBLISHABLE_KEY) headers.set('x-publishable-api-key', PUBLISHABLE_KEY);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(`${API_URL}${storePath}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || res.statusText);
  }
  return data as T;
}

async function organizerLogin(): Promise<string | null> {
  if (!ORGANIZER_EMAIL || !ORGANIZER_PASSWORD) return null;
  const data = await fetchStoreJson<{ token?: string; access_token?: string }>(
    '/store/organizers/login',
    {
      method: 'POST',
      body: JSON.stringify({ email: ORGANIZER_EMAIL, password: ORGANIZER_PASSWORD }),
    },
  );
  return data.access_token ?? data.token ?? null;
}

async function fetchTicketsFromApi(token: string): Promise<TicketRow[]> {
  const eventsData = await fetchStoreJson<{ events?: Record<string, unknown>[] }>(
    '/store/organizers/events?include_all=true&limit=100',
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const rows: TicketRow[] = [];
  for (const event of eventsData.events ?? []) {
    const eventId = String(event.id ?? '');
    const eventName = String(event.title ?? event.name ?? 'Event');
    const eventDate = formatDate(String(event.date ?? event.event_date ?? ''));

    const ticketsData = await fetchStoreJson<{ tickets?: Record<string, unknown>[] }>(
      `/store/organizers/tickets?event_id=${encodeURIComponent(eventId)}&limit=500&offset=0`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const byType = new Map<string, number>();
    for (const t of ticketsData.tickets ?? []) {
      const type = String(t.ticket_type ?? t.ticketType ?? 'Unknown');
      byType.set(type, (byType.get(type) ?? 0) + 1);
    }

    if (byType.size === 0) {
      rows.push({ eventName, eventDate, ticketType: '(no tickets issued)', ticketsSold: 0 });
    } else {
      for (const [ticketType, ticketsSold] of byType) {
        rows.push({ eventName, eventDate, ticketType, ticketsSold });
      }
    }
  }
  return rows;
}

async function fetchTicketsFromDatabase(): Promise<TicketRow[]> {
  if (!AMPEX_DATABASE_URL) return [];
  const pool = new pg.Pool({ connectionString: AMPEX_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const { rows } = await pool.query<{
      event_name: string;
      event_date: Date;
      ticket_type: string;
      tickets_sold: number;
    }>(
      `SELECT e.name AS event_name,
              e.event_date::date AS event_date,
              t.ticket_type,
              COUNT(*)::int AS tickets_sold
       FROM ticket t
       INNER JOIN event e ON e.id = t.event_id
       WHERE ($1 = '' OR e.organizer_id = $1)
         AND t.deleted_at IS NULL
       GROUP BY e.name, e.event_date, t.ticket_type
       ORDER BY e.event_date, t.ticket_type`,
      [ORGANIZER_ID],
    );
    return rows.map((r) => ({
      eventName: r.event_name,
      eventDate: formatDate(r.event_date),
      ticketType: r.ticket_type,
      ticketsSold: r.tickets_sold,
    }));
  } finally {
    await pool.end();
  }
}

async function fetchAmpExTickets(): Promise<{ rows: TicketRow[]; note: string }> {
  if (AMPEX_DATABASE_URL) {
    try {
      const rows = await fetchTicketsFromDatabase();
      if (rows.length > 0) return { rows, note: '' };
    } catch (err) {
      return {
        rows: [],
        note: `AmpEx DB query failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (!API_URL || !PUBLISHABLE_KEY) {
    return { rows: [], note: 'AmpEx API not configured' };
  }

  try {
    const token = await organizerLogin();
    if (!token) {
      return {
        rows: [],
        note: 'Add ORGANIZER_EMAIL + ORGANIZER_PASSWORD or AMPEX_DATABASE_URL to .env for ticket counts',
      };
    }
    const rows = await fetchTicketsFromApi(token);
    return { rows, note: '' };
  } catch (err) {
    return {
      rows: [],
      note: `AmpEx API query failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function main() {
  logDatabaseConfig();
  const generated = new Date().toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
  const { may, june } = await fetchRsvpSummary();

  const harvest = may.find((r) => r.session === 'harvest-table');
  const afterLunch = may.find((r) => r.session === 'after-party-lunch');
  const legacyAfter = may.find((r) => r.session === 'the-after-party');
  const afterRsvps = (afterLunch?.rsvps ?? 0) + (legacyAfter?.rsvps ?? 0);
  const aprilRsvps =
    FIRST_EDITION.rsvps.harvestTable + FIRST_EDITION.rsvps.afterLunch;
  const totalRsvps =
    aprilRsvps +
    (harvest?.rsvps ?? 0) +
    afterRsvps +
    (june?.rsvps ?? 0);

  const secondEditionRsvpTotal = (harvest?.rsvps ?? 0) + afterRsvps;

  const rsvpSections: RsvpSection[] = [
    {
      name: FIRST_EDITION.name,
      date: FIRST_EDITION.date,
      rows: [
        { session: sessionLabel('harvest-table'), count: FIRST_EDITION.rsvps.harvestTable },
        { session: sessionLabel('after-party-lunch'), count: FIRST_EDITION.rsvps.afterLunch },
      ],
      total: aprilRsvps,
    },
    {
      name: SECOND_EDITION.name,
      date: SECOND_EDITION.date,
      rows: [
        { session: sessionLabel('harvest-table'), count: harvest?.rsvps ?? 0 },
        { session: sessionLabel('after-party-lunch'), count: afterRsvps },
      ],
      total: secondEditionRsvpTotal,
    },
  ];

  if (june && june.rsvps > 0) {
    rsvpSections.push({
      name: JUNE_GATHERING.name,
      date: JUNE_GATHERING.date,
      rows: [{ session: 'June RSVP (all sessions)', count: june.rsvps }],
      total: june.rsvps,
    });
  }

  const lines: string[][] = [
    ['You & Me Africa — Event Summary'],
    [`Generated`, generated],
    [''],
    [`RSVPs — ${FIRST_EDITION.name}`, FIRST_EDITION.date],
    ['Session', 'RSVP Count'],
    [
      sessionLabel('harvest-table'),
      String(FIRST_EDITION.rsvps.harvestTable),
    ],
    [
      sessionLabel('after-party-lunch'),
      String(FIRST_EDITION.rsvps.afterLunch),
    ],
    ['', String(aprilRsvps)],
    [''],
    [`RSVPs — ${SECOND_EDITION.name}`, SECOND_EDITION.date],
    ['Session', 'RSVP Count'],
    [
      sessionLabel('harvest-table'),
      String(harvest?.rsvps ?? 0),
    ],
    [
      sessionLabel('after-party-lunch'),
      String(afterRsvps),
    ],
    ['', String((harvest?.rsvps ?? 0) + afterRsvps)],
  ];

  if (june && june.rsvps > 0) {
    lines.push(
      [''],
      [`RSVPs — ${JUNE_GATHERING.name}`, JUNE_GATHERING.date],
      ['Session', 'RSVP Count'],
      ['June RSVP (all sessions)', String(june.rsvps)],
      ['', String(june.rsvps)],
    );
  }

  lines.push(
    [''],
    ['RSVP Totals (all events)'],
    ['Total RSVPs', String(totalRsvps)],
  );

  const firstTicketRows = firstEditionTicketRows();
  const secondTicketRows = secondEditionTicketRows();
  const { rows: apiTicketRows, note } = await fetchAmpExTickets();

  const ticketSections: TicketSection[] = [
    { name: FIRST_EDITION.name, date: FIRST_EDITION.date, rows: firstTicketRows, totals: ticketTotals(firstTicketRows) },
    { name: SECOND_EDITION.name, date: SECOND_EDITION.date, rows: secondTicketRows, totals: ticketTotals(secondTicketRows) },
  ];

  let grandPaid = 0;
  let grandSponsor = 0;

  const firstTotals = appendTicketSection(lines, FIRST_EDITION, firstTicketRows);
  grandPaid += firstTotals.paid;
  grandSponsor += firstTotals.sponsor;

  const secondTotals = appendTicketSection(lines, SECOND_EDITION, secondTicketRows);
  grandPaid += secondTotals.paid;
  grandSponsor += secondTotals.sponsor;

  if (apiTicketRows.length > 0) {
    const byEvent = new Map<string, TicketRow[]>();
    for (const row of apiTicketRows) {
      const key = `${row.eventName}|${row.eventDate}`;
      if (!byEvent.has(key)) byEvent.set(key, []);
      byEvent.get(key)!.push(row);
    }
    for (const [, rows] of byEvent) {
      const edition = { name: rows[0]!.eventName, date: rows[0]!.eventDate };
      const totals = ticketTotals(rows);
      ticketSections.push({ name: edition.name, date: edition.date, rows, totals });
      const t = appendTicketSection(lines, edition, rows);
      grandPaid += t.paid;
      grandSponsor += t.sponsor;
    }
  }

  lines.push(
    [''],
    ['Ticket Totals (all events)'],
    ['Paid ticket purchases', String(grandPaid)],
    ['Sponsor / comp tickets', String(grandSponsor)],
    ['All tickets', String(grandPaid + grandSponsor)],
  );

  const csv = lines.map((row) => row.map(esc).join(',')).join('\n');
  writeFileSync(OUT_CSV, `\uFEFF${csv}`, 'utf8');

  const html = renderSummaryHtml({
    generated,
    rsvpSections,
    ticketSections,
    totalRsvps,
    grandPaid,
    grandSponsor,
  });
  writeFileSync(OUT_HTML, html, 'utf8');

  console.log(`Wrote ${OUT_CSV}`);
  console.log(`Wrote ${OUT_HTML}`);
  console.log(
    `RSVPs — April 1st ed: Harvest ${FIRST_EDITION.rsvps.harvestTable}, After Lunch ${FIRST_EDITION.rsvps.afterLunch}`,
  );
  console.log(`Tickets — 2nd edition paid purchases: ${SECOND_EDITION.tickets.paidPurchases}`);
  console.log(`RSVPs — Session 1 (Harvest Table): ${harvest?.rsvps ?? 0}`);
  console.log(`RSVPs — Session 2 (After Lunch Party): ${afterRsvps}`);
  if (june) console.log(`RSVPs — June: ${june.rsvps}`);
  if (note && apiTicketRows.length === 0) console.log(note);
  const allManual = [...firstTicketRows, ...secondTicketRows, ...apiTicketRows];
  if (allManual.length > 0) {
    console.log(`Tickets — ${allManual.reduce((s, r) => s + r.ticketsSold, 0)} total`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
