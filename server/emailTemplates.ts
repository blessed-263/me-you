import type { RsvpSessionId } from './rsvpSessions.js';
import {
  EVENT_DATE_LABEL,
  EVENT_DATE_SHORT,
  RSVP_SESSION_META,
} from './rsvpSessions.js';
import {
  VENUE_AREA,
  VENUE_MAPS_URL,
  VENUE_NAME,
  VENUE_STREET,
} from './venue.js';

/** Brand tokens aligned with src/index.css */
const colors = {
  bg: '#f6f1e8',
  surface: '#e8e4dc',
  border: '#dcd8cf',
  accent: '#5a5a40',
  text: '#1a1a1a',
  muted: '#6b6b5d',
} as const;

const serif = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const sans = "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const type = {
  labelSm: `font-family:${sans};font-size:9px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;`,
  label: `font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;`,
  body: `font-family:${sans};font-size:16px;font-weight:400;line-height:1.8;`,
  bodyLight: `font-family:${sans};font-size:16px;font-weight:300;line-height:1.8;`,
  bodySm: `font-family:${sans};font-size:14px;font-weight:300;line-height:1.65;`,
  bodyMd: `font-family:${sans};font-size:15px;font-weight:300;line-height:1.65;`,
  signoffName: `font-family:${sans};font-size:22px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;line-height:1.3;`,
  headingHero: `font-family:${serif};font-size:48px;font-weight:600;line-height:1.35;`,
  headingSection: `font-family:${serif};font-size:36px;font-weight:600;line-height:1.25;`,
  sessionTitle: `font-family:${serif};font-size:34px;font-weight:600;line-height:1.2;`,
  timeValue: `font-family:${serif};font-size:28px;font-weight:500;line-height:1.2;`,
  detailValue: `font-family:${serif};font-size:22px;font-weight:500;line-height:1.35;`,
  locationValue: `font-family:${serif};font-size:20px;font-weight:500;line-height:1.45;`,
  locationSub: `font-family:${serif};font-size:18px;font-weight:500;font-style:italic;line-height:1.45;`,
  button: `font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;`,
} as const;

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap';

const SITE_ORIGIN = 'https://www.youandmeafrica.com';
const LOGO_URL = `${SITE_ORIGIN}/favicon.png`;
export const EVENT_TITLE = 'YOU&ME with Martell';

/** Hero images for guest broadcast emails (must be absolute URLs for inboxes). */
export const GUEST_EMAIL_HERO_IMAGES = {
  /** Optimized JPEG — run npm run email:optimize-hero after replacing source */
  harvestTable: `${SITE_ORIGIN}/images/email-hero-harvest.jpg`,
  /** Harvest Table hero photo */
  harvestTableAlt: `${SITE_ORIGIN}/images/email-hero-harvest-table.png`,
  afterParty: `${SITE_ORIGIN}/images/email-hero-after-party.jpg`,
  /** Shared hero image for guest broadcast emails */
  guestShared: `${SITE_ORIGIN}/images/email-hero-youandme.png`,
  siteHero: `${SITE_ORIGIN}/images/_DSC6449.jpg`,
  dj: `${SITE_ORIGIN}/images/event-dj.png`,
} as const;

/** Display size in email (600px wide) */
export const EMAIL_HERO_HARVEST_DISPLAY = { width: 600, height: 400 } as const;
export const EMAIL_HERO_AFTER_PARTY_DISPLAY = { width: 600, height: 400 } as const;

type EmailSponsor = {
  label: string;
  src: string;
  href?: string;
  height: number;
};

const EMAIL_SPONSORS: EmailSponsor[] = [
  {
    label: "Nela's Kitchen",
    src: `${SITE_ORIGIN}/sponsors/nelas%20brown%20.png`,
    height: 40,
  },
  {
    label: 'Martell',
    src: `${SITE_ORIGIN}/sponsors/martell%20brown%20.png`,
    href: 'https://www.martell.com',
    height: 52,
  },
  {
    label: 'Stella Artois',
    src: `${SITE_ORIGIN}/sponsors/stella%20brown%20.png`,
    href: 'https://www.stellaartois.com',
    height: 40,
  },
];

function emailSponsorCell(sponsor: EmailSponsor): string {
  const img = `<img src="${escapeHtml(sponsor.src)}" alt="${escapeHtml(sponsor.label)}" width="${Math.round(sponsor.height * 2.2)}" height="${sponsor.height}" border="0" style="display:block;height:${sponsor.height}px;width:auto;max-width:140px;margin:0 auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />`;
  const inner = sponsor.href
    ? `<a href="${escapeHtml(sponsor.href)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">${img}</a>`
    : img;

  return `<td align="center" valign="bottom" style="padding:8px 10px;width:33%;">${inner}</td>`;
}

function emailSponsorsFooter(): string {
  const cells = EMAIL_SPONSORS.map(emailSponsorCell).join('');

  return `
    <tr>
      <td class="sponsors-surface" bgcolor="#ffffff" style="padding:32px 20px 8px;text-align:center;border-top:1px solid ${colors.border};background-color:#ffffff;">
        <p style="margin:0 0 20px;${type.labelSm}color:${colors.muted};letter-spacing:0.35em;">
          Partners &amp; Sponsors
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color:#ffffff;">
          <tr>
            ${cells}
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function eventTitleHtml(): string {
  return escapeHtml(EVENT_TITLE);
}

function emailShell(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
  <link href="${FONTS_URL}" rel="stylesheet" />
  <style>
    body, table, td, p, h1, a {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Keep sponsor logos visible in dark mode by pinning a light surface. */
    @media (prefers-color-scheme: dark) {
      .sponsors-surface {
        background-color: #ffffff !important;
      }
    }
    [data-ogsc] .sponsors-surface {
      background-color: #ffffff !important;
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${colors.bg};font-family:${sans};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.bg};font-family:${sans};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;font-family:${sans};">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Session hero: experience name + date + start/end times. */
function sessionExperienceCard(sessionId: RsvpSessionId): string {
  const s = RSVP_SESSION_META[sessionId];
  const title = escapeHtml(s.title);
  const tagline = escapeHtml(s.tagline);
  const start = escapeHtml(s.timeStart);
  const end = escapeHtml(s.timeEnd);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.surface};border:1px solid ${colors.border};">
      <tr>
        <td style="padding:24px 22px 20px;">
          <p style="margin:0 0 10px;${type.label}color:${colors.accent};">
            Your experience
          </p>
          <p style="margin:0 0 8px;${type.sessionTitle}color:${colors.text};">
            ${title}
          </p>
          <p style="margin:0 0 20px;${type.bodySm}color:${colors.muted};">
            ${tagline}
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${colors.border};">
            <tr>
              <td style="padding:18px 0 0;width:50%;vertical-align:top;">
                <p style="margin:0 0 6px;${type.labelSm}color:${colors.muted};">Date</p>
                <p style="margin:0;${type.detailValue}color:${colors.text};">${EVENT_DATE_SHORT}</p>
              </td>
              <td style="padding:18px 0 0;width:50%;vertical-align:top;">
                <p style="margin:0 0 6px;${type.labelSm}color:${colors.muted};">Day</p>
                <p style="margin:0;${type.bodySm}color:${colors.text};font-weight:500;">Sunday</p>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
            <tr>
              <td style="padding:16px 14px;background-color:#ffffff;border:1px solid ${colors.border};width:48%;vertical-align:top;text-align:center;">
                <p style="margin:0 0 4px;${type.labelSm}color:${colors.muted};">From</p>
                <p style="margin:0;${type.timeValue}color:${colors.text};">${start}</p>
              </td>
              <td style="width:4%;font-size:0;line-height:0;">&nbsp;</td>
              <td style="padding:16px 14px;background-color:#ffffff;border:1px solid ${colors.border};width:48%;vertical-align:top;text-align:center;">
                <p style="margin:0 0 4px;${type.labelSm}color:${colors.muted};">Until</p>
                <p style="margin:0;${type.timeValue}color:${colors.text};">${end}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function locationBlock(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
      <tr>
        <td style="padding:0 0 8px;${type.labelSm}color:${colors.muted};">Venue</td>
      </tr>
      <tr>
        <td style="color:${colors.text};">
          <span style="display:block;${type.locationValue}">${VENUE_NAME}</span>
          <span style="display:block;${type.locationSub}color:${colors.muted};">${VENUE_STREET}</span>
          <span style="display:block;${type.locationSub}color:${colors.muted};">${VENUE_AREA}</span>
        </td>
      </tr>
    </table>
  `;
}

export type RsvpEmailPayload = {
  fullName: string;
  email: string;
  phone: string | null;
  sessionId: RsvpSessionId;
  sessionTitle: string;
  sessionTime: string;
};

export function renderRsvpConfirmationEmail(
  safeName: string,
  sessionId: RsvpSessionId,
): string {
  const session = RSVP_SESSION_META[sessionId];
  const pageTitle = `${session.title} — RSVP confirmed`;

  return emailShell(
    `
    <tr>
      <td style="padding:0 0 24px;text-align:center;">
        <img src="${LOGO_URL}" alt="${eventTitleHtml()}" width="48" height="48" style="display:inline-block;border-radius:50%;border:1px solid ${colors.border};padding:2px;" />
        <p style="margin:16px 0 0;${type.label}color:${colors.muted};">
          ${eventTitleHtml()}
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#ffffff;border:1px solid ${colors.border};padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="height:3px;background-color:${colors.accent};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 28px 24px;text-align:center;">
              <p style="margin:0 0 12px;${type.label}color:${colors.accent};">
                RSVP confirmed
              </p>
              <h1 style="margin:0 0 20px;${type.headingHero}font-size:40px;color:${colors.text};">
                Thank you, ${safeName}
              </h1>
              <p style="margin:0;${type.bodyLight}color:${colors.muted};max-width:400px;margin-left:auto;margin-right:auto;">
                Your place is reserved for the experience below. Please arrive within the times shown.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              ${sessionExperienceCard(sessionId)}
              ${locationBlock()}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 36px;text-align:center;">
              <a href="${VENUE_MAPS_URL}" style="display:inline-block;background-color:${colors.text};color:${colors.bg};${type.button}padding:16px 40px;">
                Get directions
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 12px 0;text-align:center;">
        <p style="margin:0;${type.bodySm}color:${colors.muted};">
          ${eventTitleHtml()} · ${EVENT_DATE_LABEL}
        </p>
      </td>
    </tr>
  `,
    pageTitle,
  );
}

export function renderRsvpNotifyEmail(
  safeName: string,
  payload: RsvpEmailPayload,
  detailRows: string,
): string {
  const session = RSVP_SESSION_META[payload.sessionId];
  const pageTitle = `New RSVP — ${session.title}`;

  return emailShell(
    `
    <tr>
      <td style="padding:0 0 16px;">
        <p style="margin:0;${type.label}color:${colors.accent};">
          New RSVP · ${eventTitleHtml()}
        </p>
        <h1 style="margin:10px 0 0;${type.headingSection}font-size:32px;color:${colors.text};">
          ${safeName}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 20px;">
        ${sessionExperienceCard(payload.sessionId)}
      </td>
    </tr>
    <tr>
      <td style="background-color:#ffffff;border:1px solid ${colors.border};padding:24px 22px;">
        <p style="margin:0 0 16px;${type.labelSm}color:${colors.accent};">
          Guest details
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${type.body}color:${colors.text};">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${colors.border};${type.labelSm}color:${colors.muted};width:32%;vertical-align:top;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid ${colors.border};font-family:${sans};font-size:15px;font-weight:400;vertical-align:top;">${escapeHtml(payload.email)}</td>
          </tr>
          ${detailRows}
        </table>
      </td>
    </tr>
  `,
    pageTitle,
  );
}

export function notifyDetailRow(
  label: string,
  value: string,
  last = false,
): string {
  const border = last ? '' : `border-bottom:1px solid ${colors.border};`;
  return `<tr>
    <td style="padding:10px 0;${border}${type.labelSm}color:${colors.muted};vertical-align:top;">${label}</td>
    <td style="padding:10px 0;${border}font-family:${sans};font-size:15px;font-weight:400;line-height:1.65;vertical-align:top;">${value}</td>
  </tr>`;
}

/** Copy for one-off guest updates (edit emails/guest-broadcast.content.ts). */
export type GuestBroadcastContent = {
  /** Email subject line */
  subject: string;
  /** Inbox preview (optional) */
  preheader?: string;
  /** Small label above headline, e.g. "Event update" */
  eyebrow?: string;
  headline: string;
  /**
   * Main copy. Separate paragraphs with a blank line.
   * Use {{name}} for a first-name merge when sending.
   */
  body: string;
  /** Optional date / venue / dress code block */
  highlight?: {
    title: string;
    items?: string[];
    details?: { label: string; value: string }[];
  };
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  signoff?: string;
  signoffName?: string;
  /** Center body, details card, and sign-off */
  centered?: boolean;
  /** Hide sponsor logos/footer (can reduce "Promotions" classification in some inboxes). */
  showSponsors?: boolean;
  /** Full-width hero image URL (required for guest broadcast layout) */
  heroImageUrl: string;
  heroImageAlt?: string;
  /** Optional display dimensions for faster layout (defaults 600×400) */
  heroDisplayWidth?: number;
  heroDisplayHeight?: number;
};

const BODY_WRAP =
  'word-break:break-word;overflow-wrap:anywhere;-webkit-hyphens:auto;hyphens:auto;';

function applyNameMerge(text: string, guestName?: string): string {
  const name = guestName?.trim() || 'there';
  return text.replace(/\{\{name\}\}/gi, name);
}

function isGreetingParagraph(text: string): boolean {
  // Accept common greeting variants from content blocks (we render our own greeting line).
  // Examples: "Hi, {{name}},", "Hi {{name}}", "Hey, {{name}},", "Hey {{name}}"
  return /^(hi|hey)\b[, ]\s*.+/i.test(text.trim());
}

function isCapsSectionTitle(text: string): boolean {
  const p = text.trim();
  if (isGreetingParagraph(p)) return false;
  if (p.includes(',')) return false;
  return p.length <= 40 && p === p.toUpperCase() && /[A-Z]/.test(p);
}

function greetingParagraphHtml(guestName: string | undefined, centered: boolean): string {
  const align = centered ? 'text-align:center;' : '';
  const safeName = escapeHtml(guestName?.trim() || 'there');
  // No comma after name (some clients wrap/truncate oddly on punctuation).
  return `<p style="margin:0 0 22px;${type.bodyLight}font-size:17px;color:${colors.text};${BODY_WRAP}${align}">Hey ${safeName}</p>`;
}

function bodyParagraphsHtml(
  body: string,
  guestName?: string,
  centered = false,
): string {
  const merged = applyNameMerge(body, guestName);
  let parts = merged
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const align = centered ? 'text-align:center;' : '';
  let greetingHtml = '';

  if (parts.length > 0 && isGreetingParagraph(parts[0])) {
    greetingHtml = greetingParagraphHtml(guestName, centered);
    parts = parts.slice(1);
  }

  const bodyHtml = parts
    .map((p) => {
      if (isCapsSectionTitle(p)) {
        return `<p style="margin:0 0 20px;${type.label}color:${colors.accent};font-size:11px;letter-spacing:0.12em;${align}">${escapeHtml(p)}</p>`;
      }
      return `<p style="margin:0 0 18px;${type.bodyLight}color:${colors.muted};${BODY_WRAP}${align}">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`;
    })
    .join('');

  return greetingHtml + bodyHtml;
}

function highlightCard(
  highlight: GuestBroadcastContent['highlight'],
  centered = false,
): string {
  if (!highlight) return '';

  const items = highlight.items ?? [];
  const details = highlight.details ?? [];
  if (items.length === 0 && details.length === 0) return '';

  const align = centered ? 'text-align:center;' : '';

  const itemRows = items
    .map(
      (line) =>
        `<tr>
          <td style="padding:8px 0;${type.bodyMd}color:${colors.text};${align}">
            ${escapeHtml(line)}
          </td>
        </tr>`,
    )
    .join('');

  const detailRows = details
    .map((row, i) => {
      const last = i === details.length - 1;
      const border = last ? '' : `border-bottom:1px solid ${colors.border};`;
      if (centered) {
        return `<tr>
          <td style="padding:18px 12px;${border}${align}">
            <p style="margin:0 0 8px;${type.labelSm}color:${colors.muted};">${escapeHtml(row.label)}</p>
            <p style="margin:0;${type.bodyLight}color:${colors.text};${BODY_WRAP}">${escapeHtml(row.value)}</p>
          </td>
        </tr>`;
      }
      return `<tr>
        <td style="padding:12px 0;${border}${type.labelSm}color:${colors.muted};width:34%;vertical-align:top;">
          ${escapeHtml(row.label)}
        </td>
        <td style="padding:12px 0;${border}${type.bodyLight}color:${colors.text};vertical-align:top;">
          <span style="${BODY_WRAP}">${escapeHtml(row.value)}</span>
        </td>
      </tr>`;
    })
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 28px;background-color:#ffffff;border:1px solid ${colors.border};">
      <tr>
        <td style="height:2px;background-color:${colors.accent};font-size:0;line-height:0;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding:26px 24px 28px;${align}">
          <p style="margin:0 0 20px;${type.label}color:${colors.accent};">
            ${escapeHtml(highlight.title)}
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${detailRows}
            ${itemRows}
          </table>
        </td>
      </tr>
    </table>
  `;
}

function guestEmailHeroBlock(
  content: GuestBroadcastContent,
  safeHeadline: string,
): string {
  const heroUrl = escapeHtml(content.heroImageUrl);
  const heroAlt = escapeHtml(content.heroImageAlt ?? content.eyebrow ?? EVENT_TITLE);
  const heroW = content.heroDisplayWidth ?? EMAIL_HERO_HARVEST_DISPLAY.width;
  const eyebrow = content.eyebrow
    ? `<p style="margin:0 0 10px;${type.label}color:${colors.bg};opacity:0.85;">${escapeHtml(content.eyebrow)}</p>`
    : '';

  return `
    <tr>
      <td align="center" style="padding:0;background-color:${colors.text};">
        <img
          src="${heroUrl}"
          alt="${heroAlt}"
          width="${heroW}"
          border="0"
          style="display:block;width:100%;max-width:${heroW}px;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;line-height:100%;font-size:16px;"
        />
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px 36px;text-align:center;background-color:${colors.text};">
        ${eyebrow}
        <h1 style="margin:0;${type.headingHero}font-size:40px;font-weight:500;color:${colors.bg};letter-spacing:-0.02em;">
          ${safeHeadline}
        </h1>
      </td>
    </tr>
  `;
}

function ctaButton(
  cta: { label: string; href: string },
  secondary = false,
): string {
  const bg = secondary ? colors.surface : colors.text;
  const fg = secondary ? colors.text : colors.bg;
  const border = secondary ? `border:1px solid ${colors.border};` : '';

  return `<a href="${escapeHtml(cta.href)}" style="display:inline-block;background-color:${bg};color:${fg};${border}${type.button}padding:16px 32px;margin:6px 4px;">
    ${escapeHtml(cta.label)}
  </a>`;
}

/** Branded HTML for guest updates / reminders. */
export function renderGuestBroadcastEmail(
  content: GuestBroadcastContent,
  guestName?: string,
): string {
  const centered = content.centered !== false;
  const safeHeadline = escapeHtml(applyNameMerge(content.headline, guestName));
  const signoffAlign = centered ? 'text-align:center;' : '';
  const signoff =
    content.signoff || content.signoffName
      ? `<p style="margin:28px 0 0;${type.bodyLight}color:${colors.muted};${signoffAlign}">
          ${content.signoff ? `${escapeHtml(content.signoff)}<br />` : ''}
          ${content.signoffName ? `<span style="${type.signoffName}color:${colors.text};">${escapeHtml(content.signoffName)}</span>` : ''}
        </p>`
      : '';

  const ctas =
    content.cta || content.secondaryCta
      ? `<tr>
          <td style="padding:4px 32px 36px;text-align:center;background-color:#ffffff;">
            ${content.cta ? ctaButton(content.cta) : ''}
            ${content.secondaryCta ? ctaButton(content.secondaryCta, true) : ''}
          </td>
        </tr>`
      : '';

  const preheader = content.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
        ${escapeHtml(content.preheader)}
      </div>`
    : '';

  const showSponsors = content.showSponsors !== false;

  return emailShell(
    `
    ${preheader}
    <tr>
      <td style="padding:0 0 20px;text-align:center;">
        <img
          src="${LOGO_URL}"
          alt="${eventTitleHtml()}"
          width="56"
          height="56"
          style="display:inline-block;border-radius:50%;border:1px solid ${colors.border};padding:3px;background-color:#ffffff;"
        />
        <p style="margin:14px 0 0;${type.label}color:${colors.muted};letter-spacing:0.2em;">
          ${eventTitleHtml()}
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#ffffff;border:1px solid ${colors.border};padding:0;overflow:hidden;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${guestEmailHeroBlock(content, safeHeadline)}
          <tr>
            <td style="padding:36px 32px 12px;${centered ? 'text-align:center;' : ''}background-color:#ffffff;">
              ${bodyParagraphsHtml(content.body, guestName, centered)}
              ${highlightCard(content.highlight, centered)}
              ${signoff}
            </td>
          </tr>
          ${ctas}
        </table>
      </td>
    </tr>
    ${showSponsors ? emailSponsorsFooter() : ''}
    <tr>
      <td style="padding:20px 16px 8px;text-align:center;">
        <p style="margin:0 0 6px;${type.labelSm}color:${colors.muted};">
          ${eventTitleHtml()}
        </p>
        <p style="margin:0 0 10px;${type.bodySm}color:${colors.muted};">
          ${EVENT_DATE_LABEL}
        </p>
        <p style="margin:0;${type.labelSm}color:${colors.muted};">
          <a href="https://www.instagram.com/youandmeafrica/" style="color:${colors.accent};text-decoration:none;font-weight:600;">@youandmeafrica</a>
        </p>
      </td>
    </tr>
  `,
    content.subject,
  );
}
