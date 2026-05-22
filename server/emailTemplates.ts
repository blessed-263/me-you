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
  bodySm: `font-family:${sans};font-size:14px;font-weight:300;line-height:1.8;`,
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

const LOGO_URL =
  'https://gallery.youandmeafrica.com/site-icon/you-me.jpeg';
export const EVENT_TITLE = 'YOU&ME with Martell';

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
  <title>${escapeHtml(title)}</title>
  <link href="${FONTS_URL}" rel="stylesheet" />
  <style>
    body, table, td, p, h1, a {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${colors.bg};font-family:${sans};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.bg};font-family:${sans};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;font-family:${sans};">
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
