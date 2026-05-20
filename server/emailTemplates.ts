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

/** Matches site Tailwind scale (see src/App.tsx, src/RsvpPage.tsx) */
const type = {
  labelSm: `font-family:${sans};font-size:9px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;`,
  label: `font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;`,
  body: `font-family:${sans};font-size:16px;font-weight:400;line-height:1.8;`,
  bodyLight: `font-family:${sans};font-size:16px;font-weight:300;line-height:1.8;`,
  bodySm: `font-family:${sans};font-size:14px;font-weight:300;line-height:1.8;`,
  headingHero: `font-family:${serif};font-size:48px;font-weight:600;line-height:1.35;`,
  headingSection: `font-family:${serif};font-size:36px;font-weight:600;line-height:1.25;`,
  detailValue: `font-family:${serif};font-size:30px;font-weight:500;line-height:1.35;`,
  detailItalic: `font-family:${serif};font-size:30px;font-weight:500;font-style:italic;line-height:1.35;`,
  locationValue: `font-family:${serif};font-size:20px;font-weight:500;line-height:1.45;`,
  locationSub: `font-family:${serif};font-size:18px;font-weight:500;font-style:italic;line-height:1.45;`,
  button: `font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;`,
} as const;

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap';

const LOGO_URL =
  'https://gallery.youandmeafrica.com/site-icon/you-me.jpeg';
const MAPS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=Primedia+Rooftop,+Freeman+Drive,+Sandton,+South+Africa';

export const EVENT_TITLE = 'YOU & ME: The Second Edition';

function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>You &amp; Me</title>
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

export type RsvpEmailPayload = {
  fullName: string;
  email: string;
  phone: string | null;
  guestCount: number;
  dietaryNotes: string | null;
  notes: string | null;
};

export function renderRsvpConfirmationEmail(
  safeName: string,
  guestCount: number,
): string {
  const guestLabel = guestCount === 1 ? '1 guest' : `${guestCount} guests`;

  return emailShell(`
    <tr>
      <td style="padding:0 0 28px;text-align:center;">
        <img src="${LOGO_URL}" alt="You &amp; Me Africa" width="48" height="48" style="display:inline-block;border-radius:50%;border:1px solid ${colors.border};padding:2px;" />
        <p style="margin:20px 0 4px;${type.headingSection}font-size:32px;color:${colors.text};">
          YOU &amp; ME
        </p>
        <p style="margin:0;${type.label}color:${colors.accent};">
          The Second Edition
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#ffffff;border:1px solid ${colors.border};padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${sans};">
          <tr>
            <td style="height:3px;background-color:${colors.accent};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:40px 36px 28px;text-align:center;">
              <p style="margin:0 0 16px;${type.label}color:${colors.accent};">
                RSVP Confirmed
              </p>
              <h1 style="margin:0 0 24px;${type.headingHero}color:${colors.text};">
                Thank you, ${safeName}
              </h1>
              <p style="margin:0;${type.bodyLight}color:${colors.muted};max-width:420px;margin-left:auto;margin-right:auto;">
                Your place at <strong style="font-family:${sans};font-weight:500;color:${colors.text};">${EVENT_TITLE}</strong> is reserved.
                We look forward to sharing the gathering with you.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.surface};border:1px solid ${colors.border};">
                <tr>
                  <td style="padding:28px 24px;">
                    <p style="margin:0 0 24px;${type.labelSm}color:${colors.accent};">
                      Event details
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid ${colors.border};${type.labelSm}color:${colors.muted};width:36%;vertical-align:top;">
                          The Date
                        </td>
                        <td style="padding:12px 0;border-bottom:1px solid ${colors.border};${type.detailValue}color:${colors.text};vertical-align:top;">
                          31 May <span style="${type.detailItalic}color:${colors.muted};">2026</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid ${colors.border};${type.labelSm}color:${colors.muted};vertical-align:top;">
                          The Time
                        </td>
                        <td style="padding:12px 0;border-bottom:1px solid ${colors.border};${type.detailValue}color:${colors.text};vertical-align:top;">
                          11:00 AM <span style="${type.detailItalic}color:${colors.muted};">to Late</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid ${colors.border};${type.labelSm}color:${colors.muted};vertical-align:top;">
                          The Setting
                        </td>
                        <td style="padding:12px 0;border-bottom:1px solid ${colors.border};color:${colors.text};vertical-align:top;">
                          <span style="display:block;${type.locationValue}">Primedia Rooftop</span>
                          <span style="display:block;${type.locationSub}color:${colors.muted};">Freeman Drive</span>
                          <span style="display:block;${type.locationSub}color:${colors.muted};">Sandton</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;${type.labelSm}color:${colors.muted};vertical-align:top;">
                          Party
                        </td>
                        <td style="padding:12px 0;${type.detailValue}color:${colors.text};vertical-align:top;">
                          ${guestLabel}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 40px;text-align:center;">
              <a href="${MAPS_URL}" style="display:inline-block;background-color:${colors.text};color:${colors.bg};${type.button}padding:16px 40px;">
                Get Directions
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 12px 0;text-align:center;">
        <p style="margin:0;${type.bodySm}color:${colors.muted};">
          <span style="font-family:${serif};font-size:20px;font-weight:600;color:${colors.text};display:block;margin-bottom:8px;">${EVENT_TITLE}</span>
          A cultural gathering centered around music, food, conversation and community.
        </p>
      </td>
    </tr>
  `);
}

export function renderRsvpNotifyEmail(
  safeName: string,
  payload: RsvpEmailPayload,
  detailRows: string,
): string {
  return emailShell(`
    <tr>
      <td style="padding:0 0 20px;">
        <p style="margin:0;${type.label}color:${colors.accent};">
          New RSVP
        </p>
        <h1 style="margin:12px 0 0;${type.headingSection}color:${colors.text};">
          ${safeName}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="background-color:#ffffff;border:1px solid ${colors.border};padding:28px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${type.body}color:${colors.text};">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${colors.border};${type.labelSm}color:${colors.muted};width:32%;vertical-align:top;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid ${colors.border};font-family:${sans};font-size:16px;font-weight:400;vertical-align:top;">${payload.email}</td>
          </tr>
          ${detailRows}
        </table>
      </td>
    </tr>
  `);
}

export function notifyDetailRow(
  label: string,
  value: string,
  last = false,
): string {
  const border = last ? '' : `border-bottom:1px solid ${colors.border};`;
  return `<tr>
    <td style="padding:10px 0;${border}${type.labelSm}color:${colors.muted};vertical-align:top;">${label}</td>
    <td style="padding:10px 0;${border}font-family:${sans};font-size:16px;font-weight:400;line-height:1.8;vertical-align:top;">${value}</td>
  </tr>`;
}
