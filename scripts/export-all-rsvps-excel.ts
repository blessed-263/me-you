/**
 * Export all RSVPs to one Excel workbook:
 *   1. Analysis — counts and edition summary
 *   2+ Separate sheets per session / gathering with full guest lists
 *
 * Usage: npm run export:rsvps-excel
 */
import 'dotenv/config';
import path from 'node:path';
import XLSX from 'xlsx';
import { getPool, logDatabaseConfig } from '../server/db.js';
import { RSVP_SESSION_META } from '../server/rsvpSessions.js';
import { JUNE_RSVP_TABLE } from '../server/juneRsvp.js';
import {
  ALL_RSVP_COLUMNS,
  FIRST_EDITION,
  JUNE_GATHERING,
  RSVP_LIST_COLUMNS,
  SECOND_EDITION,
  sessionLabel,
} from './lib/youAndMeEventConstants.js';

const OUT_FILE = path.join(process.cwd(), 'you-and-me-all-rsvps.xlsx');

type MayRsvpRow = {
  full_name: string;
  email: string;
  phone: string | null;
  guest_count: number;
  session: string;
  created_at: Date;
};

type JuneRsvpRow = {
  full_name: string;
  email: string;
  phone: string | null;
  guest_count: number;
  created_at: Date;
};

function formatDateTime(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeSession(session: string): 'harvest-table' | 'after-party-lunch' {
  if (session === 'the-after-party') return 'after-party-lunch';
  return session as 'harvest-table' | 'after-party-lunch';
}

function toListRows(
  rows: MayRsvpRow[] | JuneRsvpRow[],
  opts?: { event?: string; session?: string },
): (string | number)[][] {
  const header = opts?.event ? [...ALL_RSVP_COLUMNS] : [...RSVP_LIST_COLUMNS];
  const data: (string | number)[][] = [header];

  rows.forEach((row, index) => {
    const base: (string | number)[] = [
      index + 1,
      row.full_name,
      row.email,
      row.phone ?? '',
      row.guest_count,
      formatDateTime(row.created_at),
    ];
    if (opts?.event) {
      base.push(opts.event, opts.session ?? '');
    }
    data.push(base);
  });

  return data;
}

function buildAnalysisSheet(data: {
  generated: string;
  harvestCount: number;
  afterLunchCount: number;
  juneCount: number;
  uniqueEmails: number;
  totalGuests: number;
}): (string | number)[][] {
  const { generated, harvestCount, afterLunchCount, juneCount, uniqueEmails, totalGuests } =
    data;
  const firstTotal =
    FIRST_EDITION.rsvps.harvestTable + FIRST_EDITION.rsvps.afterLunch;
  const secondTotal = harvestCount + afterLunchCount;
  const grandTotal = firstTotal + secondTotal + juneCount;

  const rows: (string | number)[][] = [
    ['You & Me Africa — RSVP Analysis'],
    ['Generated', generated],
    [],
    ['RSVPs by edition and session'],
    ['Edition', 'Date', 'Session', 'Count'],
    [
      FIRST_EDITION.name,
      FIRST_EDITION.date,
      sessionLabel('harvest-table'),
      FIRST_EDITION.rsvps.harvestTable,
    ],
    [
      FIRST_EDITION.name,
      FIRST_EDITION.date,
      sessionLabel('after-party-lunch'),
      FIRST_EDITION.rsvps.afterLunch,
    ],
    [FIRST_EDITION.name, FIRST_EDITION.date, 'Edition total', firstTotal],
    [],
    [
      SECOND_EDITION.name,
      SECOND_EDITION.date,
      sessionLabel('harvest-table'),
      harvestCount,
    ],
    [
      SECOND_EDITION.name,
      SECOND_EDITION.date,
      sessionLabel('after-party-lunch'),
      afterLunchCount,
    ],
    [SECOND_EDITION.name, SECOND_EDITION.date, 'Edition total', secondTotal],
    [],
    [JUNE_GATHERING.name, JUNE_GATHERING.date, 'June RSVP (all)', juneCount],
    [],
    ['Totals'],
    ['Metric', 'Value'],
    ['Total RSVPs (all editions)', grandTotal],
    ['Second edition + June (in database)', secondTotal + juneCount],
    ['Unique emails (database lists)', uniqueEmails],
    ['Total guests (database lists)', totalGuests],
    [],
    ['Ticket summary — Second Edition (manual)'],
    ['Paid ticket purchases', SECOND_EDITION.tickets.paidPurchases],
    ...SECOND_EDITION.tickets.sponsor.map((s) => [
      `Sponsor — ${s.type}`,
      s.count,
    ]),
    [
      'Sponsor / comp total',
      SECOND_EDITION.tickets.sponsor.reduce((n, s) => n + s.count, 0),
    ],
    [],
    ['Notes'],
    [
      'First edition guest names are not in the database; counts above are archived figures.',
    ],
    [
      `Harvest Table sheet: ${RSVP_SESSION_META['harvest-table'].title} · ${RSVP_SESSION_META['harvest-table'].time}`,
    ],
    [
      `After Lunch Party sheet: ${RSVP_SESSION_META['after-party-lunch'].title} · ${RSVP_SESSION_META['after-party-lunch'].time}`,
    ],
  ];

  return rows;
}

function appendSheet(
  workbook: XLSX.WorkBook,
  name: string,
  rows: (string | number)[][],
): void {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 34 },
    { wch: 18 },
    { wch: 8 },
    { wch: 22 },
    { wch: 36 },
    { wch: 32 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

async function main() {
  logDatabaseConfig();
  const pool = getPool();
  if (!pool) {
    console.error('Set DATABASE_URL in .env');
    process.exit(1);
  }

  try {
    const mayResult = await pool.query<MayRsvpRow>(`
      SELECT full_name, email, phone, guest_count, session, created_at
      FROM rsvp_submissions
      ORDER BY session, created_at
    `);

    let juneRows: JuneRsvpRow[] = [];
    try {
      const juneResult = await pool.query<JuneRsvpRow>(`
        SELECT full_name, email, phone, guest_count, created_at
        FROM ${JUNE_RSVP_TABLE}
        ORDER BY created_at
      `);
      juneRows = juneResult.rows;
    } catch {
      juneRows = [];
    }

    const harvestRows = mayResult.rows.filter(
      (r) => normalizeSession(r.session) === 'harvest-table',
    );
    const afterLunchRows = mayResult.rows.filter(
      (r) => normalizeSession(r.session) === 'after-party-lunch',
    );

    const allRows: {
      row: MayRsvpRow | JuneRsvpRow;
      event: string;
      session: string;
    }[] = [
      ...harvestRows.map((row) => ({
        row,
        event: SECOND_EDITION.name,
        session: sessionLabel('harvest-table'),
      })),
      ...afterLunchRows.map((row) => ({
        row,
        event: SECOND_EDITION.name,
        session: sessionLabel('after-party-lunch'),
      })),
      ...juneRows.map((row) => ({
        row,
        event: JUNE_GATHERING.name,
        session: 'June RSVP',
      })),
    ];

    const emailSet = new Set(
      allRows.map((entry) => entry.row.email.trim().toLowerCase()),
    );
    const totalGuests = allRows.reduce((n, entry) => n + entry.row.guest_count, 0);

    const generated = new Date().toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const workbook = XLSX.utils.book_new();

    appendSheet(
      workbook,
      'Analysis',
      buildAnalysisSheet({
        generated,
        harvestCount: harvestRows.length,
        afterLunchCount: afterLunchRows.length,
        juneCount: juneRows.length,
        uniqueEmails: emailSet.size,
        totalGuests,
      }),
    );

    appendSheet(
      workbook,
      'Harvest Table',
      toListRows(harvestRows),
    );

    appendSheet(
      workbook,
      'After Lunch Party',
      toListRows(afterLunchRows),
    );

    appendSheet(workbook, 'June Gathering', toListRows(juneRows));

    appendSheet(
      workbook,
      'All RSVPs',
      [
        [...ALL_RSVP_COLUMNS],
        ...allRows.map((entry, index) => [
          index + 1,
          entry.row.full_name,
          entry.row.email,
          entry.row.phone ?? '',
          entry.row.guest_count,
          formatDateTime(entry.row.created_at),
          entry.event,
          entry.session,
        ]),
      ],
    );

    XLSX.writeFile(workbook, OUT_FILE);

    console.log(`Wrote ${OUT_FILE}`);
    console.log(`  Analysis — edition totals + metrics`);
    console.log(`  Harvest Table — ${harvestRows.length} row(s)`);
    console.log(`  After Lunch Party — ${afterLunchRows.length} row(s)`);
    console.log(`  June Gathering — ${juneRows.length} row(s)`);
    console.log(`  All RSVPs — ${allRows.length} row(s)`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[export-all-rsvps-excel] failed:', err);
  process.exit(1);
});
