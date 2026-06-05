/**
 * Build local HTML previews for every guest email.
 * Usage: npm run email:preview:all
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterPartyDayOfEmail } from '../emails/after-party-day-of.content.js';
import { afterPartyLunchGuestEmail } from '../emails/after-party-lunch.content.js';
import { harvestTableDayOfEmail } from '../emails/harvest-table-day-of.content.js';
import { harvestTableGuestEmail } from '../emails/harvest-table.content.js';
import { mayGatheringTomorrowEmail } from '../emails/may-gathering-tomorrow.content.js';
import {
  renderGuestBroadcastEmail,
  renderPersonalLetterEmail,
} from '../server/emailTemplates.js';

const OUT_DIR = 'email-previews';
const PREVIEW_NAME = 'Blessed';

const hero = (file: string) => `../public/images/${file}`;
const sponsor = (file: string) => `../public/sponsors/${file}`;

type PreviewEntry = {
  id: string;
  label: string;
  subject: string;
  html: string;
};

const entries: PreviewEntry[] = [
  {
    id: 'may-gathering',
    label: 'May gathering (eve-of-event letter)',
    subject: mayGatheringTomorrowEmail.subject,
    html: renderPersonalLetterEmail({
      ...mayGatheringTomorrowEmail,
      plainTextOnly: false,
      heroImageUrl: hero('email-may-gathering-poster.png'),
    }),
  },
  {
    id: 'harvest-table',
    label: 'Harvest Table (pre-event)',
    subject: harvestTableGuestEmail.subject,
    html: renderGuestBroadcastEmail(
      {
        ...harvestTableGuestEmail,
        heroImageUrl: hero('email-hero-harvest-table.png'),
      },
      PREVIEW_NAME,
    ),
  },
  {
    id: 'harvest-table-day-of',
    label: 'Harvest Table (day-of)',
    subject: harvestTableDayOfEmail.subject,
    html: renderGuestBroadcastEmail(
      {
        ...harvestTableDayOfEmail,
        heroImageUrl: sponsor('youandme brown .png'),
      },
      PREVIEW_NAME,
    ),
  },
  {
    id: 'after-party-lunch',
    label: 'After Lunch Party (pre-event)',
    subject: afterPartyLunchGuestEmail.subject,
    html: renderGuestBroadcastEmail(
      {
        ...afterPartyLunchGuestEmail,
        heroImageUrl: hero('email-hero-youandme.png'),
      },
      PREVIEW_NAME,
    ),
  },
  {
    id: 'after-party-day-of',
    label: 'After Lunch Party (day-of)',
    subject: afterPartyDayOfEmail.subject,
    html: renderGuestBroadcastEmail(
      {
        ...afterPartyDayOfEmail,
        heroImageUrl: sponsor('youandme brown .png'),
      },
      PREVIEW_NAME,
    ),
  },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const entry of entries) {
  const file = path.join(OUT_DIR, `${entry.id}.html`);
  writeFileSync(file, entry.html, 'utf8');
  console.log(`Wrote ${file}`);
  console.log(`  ${entry.label} — ${entry.subject}`);
}

const navItems = entries
  .map(
    (e, i) =>
      `<button type="button" class="tab${i === 0 ? ' active' : ''}" data-target="${e.id}">${escapeHtml(e.label)}</button>`,
  )
  .join('\n');

const panels = entries
  .map(
    (e, i) =>
      `<section id="panel-${e.id}" class="panel${i === 0 ? ' active' : ''}">
        <header class="panel-head">
          <div>
            <h2>${escapeHtml(e.label)}</h2>
            <p class="subject">Subject: ${escapeHtml(e.subject)}</p>
          </div>
          <a class="open" href="${e.id}.html" target="_blank" rel="noopener">Open full page</a>
        </header>
        <iframe title="${escapeHtml(e.label)}" src="${e.id}.html"></iframe>
      </section>`,
  )
  .join('\n');

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>YOU&amp;ME — Email previews</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: #1a1a1a;
      color: #f6f1e8;
    }
    .wrap { max-width: 920px; margin: 0 auto; padding: 24px 16px 48px; }
    h1 {
      margin: 0 0 8px;
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    .intro { margin: 0 0 20px; color: #a8a894; font-size: 0.95rem; }
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }
    .tab {
      border: 1px solid #3a3a30;
      background: #2a2a22;
      color: #f6f1e8;
      padding: 10px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.82rem;
      line-height: 1.3;
      text-align: left;
    }
    .tab:hover { border-color: #5a5a40; }
    .tab.active { background: #5a5a40; border-color: #5a5a40; }
    .panel { display: none; }
    .panel.active { display: block; }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 12px;
    }
    .panel-head h2 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    .subject { margin: 6px 0 0; color: #a8a894; font-size: 0.88rem; }
    .open {
      color: #d4c9a8;
      font-size: 0.82rem;
      white-space: nowrap;
    }
    iframe {
      width: 100%;
      height: min(78vh, 900px);
      border: 1px solid #3a3a30;
      border-radius: 8px;
      background: #fff;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>YOU&amp;ME email previews</h1>
    <p class="intro">Preview name: ${escapeHtml(PREVIEW_NAME)}. Regenerate with <code>npm run email:preview:all</code>.</p>
    <nav class="tabs">${navItems}</nav>
    ${panels}
  </div>
  <script>
    document.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.target;
        document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('panel-' + id)?.classList.add('active');
      });
    });
  </script>
</body>
</html>`;

const indexFile = path.join(OUT_DIR, 'index.html');
writeFileSync(indexFile, indexHtml, 'utf8');
console.log(`\nWrote ${indexFile}`);
console.log('Open email-previews/index.html in your browser.');

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
