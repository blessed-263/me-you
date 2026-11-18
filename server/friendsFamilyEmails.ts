import { FF_EVENT, FF_NEXT_EVENT, FF_ORGANISER_PATH, ffSiteOrigin } from './friendsFamilyMeta.js';

/** Friends & Family email templates: table layout, inline styles, safe font fallbacks. */

const c = {
  ink: '#3B2418',
  inkSoft: '#5A3D2B',
  line: '#6B4A36',
  cream: '#E4CCB4',
  paper: '#F6ECE0',
} as const;

const serif = "'Playfair Display', Georgia, 'Times New Roman', serif";
const italic = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const sans = "'Jost', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type EmailContent = { subject: string; html: string; text: string };

function shell(title: string, inner: string): string {
  const logo = `${ffSiteOrigin()}/images/friends-family/youme-wordmark.png`;
  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${c.cream};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${c.cream}" style="background-color:${c.cream};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${c.paper};border:1px solid ${c.line};">
        <tr>
          <td align="center" style="padding:36px 32px 8px;">
            <img src="${escapeHtml(logo)}" alt="You&amp;Me" width="180" height="52" border="0" style="display:block;width:180px;height:auto;border:0;outline:none;" />
          </td>
        </tr>
        ${inner}
        <tr>
          <td align="center" style="padding:8px 32px 36px;">
            <p style="margin:24px 0 10px;font-family:${sans};font-size:11px;font-weight:600;letter-spacing:0.32em;color:${c.ink};">${escapeHtml(FF_EVENT.signOff)}</p>
            <p style="margin:0 0 14px;font-family:${sans};font-size:12px;line-height:1.6;color:${c.inkSoft};">${escapeHtml(FF_EVENT.legalLine)}</p>
            <p style="margin:0;font-family:${sans};font-size:11px;line-height:1.6;color:${c.inkSoft};">You received this email because an RSVP for this event was sent with this address. Your details are used only to manage the guest list for this event.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<tr><td align="center" style="padding:20px 32px 6px;">
    <h1 style="margin:0;font-family:${serif};font-size:34px;font-weight:400;line-height:1.25;color:${c.ink};">${text}</h1>
  </td></tr>`;
}

function para(text: string, opts: { italic?: boolean } = {}): string {
  const font = opts.italic
    ? `font-family:${italic};font-style:italic;font-size:21px;line-height:1.4;`
    : `font-family:${sans};font-size:15px;line-height:1.65;`;
  return `<tr><td align="center" style="padding:10px 40px;">
    <p style="margin:0;${font}color:${c.ink};">${text}</p>
  </td></tr>`;
}

function detailsBlock(): string {
  return `<tr><td align="center" style="padding:18px 40px 6px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${c.line};border-bottom:1px solid ${c.line};">
      <tr><td align="center" style="padding:16px 8px;font-family:${sans};font-size:14px;line-height:1.8;color:${c.ink};">
        ${escapeHtml(FF_EVENT.dateLong)}<br />
        ${escapeHtml(FF_EVENT.time)}<br />
        ${escapeHtml(`${FF_EVENT.venueName} · ${FF_EVENT.venueStreet}, ${FF_EVENT.venueArea}`)}
      </td></tr>
    </table>
  </td></tr>`;
}

function changeLine(lead: string, url: string): string {
  const safeUrl = escapeHtml(url);
  return `<tr><td align="center" style="padding:18px 40px 4px;">
    <p style="margin:0;font-family:${sans};font-size:14px;line-height:1.65;color:${c.ink};">
      ${escapeHtml(lead)} <a href="${safeUrl}" style="color:${c.ink};text-decoration:underline;">${safeUrl}</a>
    </p>
  </td></tr>`;
}

const TEXT_FOOTER = `\n\n${FF_EVENT.signOff}\n${FF_EVENT.legalLine}\nYou received this email because an RSVP for this event was sent with this address. Your details are used only to manage the guest list for this event.`;

export function renderFfGuestEmail(firstName: string, attending: boolean, rsvpUrl: string): EmailContent {
  const name = escapeHtml(firstName);
  if (attending) {
    const line2 =
      'As this is an invitation-only afternoon, your RSVP is now with the hosts for confirmation against the guest list. We will be in touch on the mobile number or email you shared.';
    return {
      subject: 'Your RSVP for Friends & Family is received',
      html: shell(
        'Your RSVP for Friends & Family is received',
        heading(`Thank you, ${name}.`) +
          para('We look forward to sharing the afternoon with you.', { italic: true }) +
          para(line2) +
          detailsBlock() +
          changeLine('Plans changed? Update your RSVP here:', rsvpUrl),
      ),
      text:
        `Thank you, ${firstName}.\n\nWe look forward to sharing the afternoon with you.\n\n${line2}\n\n` +
        `${FF_EVENT.dateLong}\n${FF_EVENT.time}\n${FF_EVENT.venueName} · ${FF_EVENT.venueStreet}, ${FF_EVENT.venueArea}\n\n` +
        `Plans changed? Update your RSVP here: ${rsvpUrl}` +
        TEXT_FOOTER,
    };
  }
  const line1 =
    'You will be missed. We hope to share good food, good music and even better company with you soon.';
  return {
    subject: 'Thank you for letting us know',
    html: shell(
      'Thank you for letting us know',
      heading(`Thank you, ${name}.`) +
        para(line1, { italic: true }) +
        changeLine('If your plans change, you can update your response here:', rsvpUrl),
    ),
    text:
      `Thank you, ${firstName}.\n\n${line1}\n\nIf your plans change, you can update your response here: ${rsvpUrl}` +
      TEXT_FOOTER,
  };
}

export function renderFfHostNotifyEmail(guest: {
  firstName: string;
  surname: string;
  mobile: string;
  email: string;
  attending: boolean;
  created: boolean;
}): EmailContent {
  const fullName = `${guest.firstName} ${guest.surname}`;
  const response = guest.attending ? 'Attending' : 'Not attending';
  const kind = guest.created ? 'New RSVP' : 'Changed RSVP';
  const organiserUrl = `${ffSiteOrigin()}${FF_ORGANISER_PATH}`;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;font-family:${sans};font-size:11px;font-weight:600;letter-spacing:0.2em;color:${c.inkSoft};vertical-align:top;">${label}</td><td style="padding:6px 0;font-family:${sans};font-size:15px;color:${c.ink};">${escapeHtml(value)}</td></tr>`;
  return {
    subject: `Friends & Family · ${kind}: ${fullName} (${response})`,
    html: shell(
      `Friends & Family · ${kind}`,
      heading(`${escapeHtml(kind)}`) +
        `<tr><td align="center" style="padding:14px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            ${row('GUEST', fullName)}${row('RESPONSE', response)}${row('MOBILE', guest.mobile)}${row('EMAIL', guest.email)}
          </table>
        </td></tr>` +
        changeLine('Review it on the guest list:', organiserUrl),
    ),
    text:
      `${kind}\n\nGuest: ${fullName}\nResponse: ${response}\nMobile: ${guest.mobile}\nEmail: ${guest.email}\n\n` +
      `Review it on the guest list: ${organiserUrl}`,
  };
}

function buttonRow(label: string, url: string): string {
  const safeUrl = escapeHtml(url);
  return `<tr><td align="center" style="padding:22px 40px 6px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center" bgcolor="${c.ink}" style="background-color:${c.ink};">
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 34px;font-family:${sans};font-size:13px;font-weight:600;letter-spacing:0.32em;color:#F4E9DC;text-decoration:none;">${escapeHtml(label)}</a>
      </td></tr>
    </table>
  </td></tr>`;
}

/** Sent once when the organiser presses Approve (attending guests only). */
export function renderFfApprovedEmail(firstName: string): EmailContent {
  const name = escapeHtml(firstName);
  const subject = 'You are on the final guest list · Friends & Family';
  const lead = 'Your invitation is fully confirmed. You are on the final guest list for Friends & Family.';
  const oneGuest = 'Please note this invitation is for you only (one guest)';
  const body = `Your name is on the guest list at the door. ${oneGuest}, so we're unable to accommodate a plus one. We look forward to sharing good food, good music and even better company with you.`;
  // HTML version: the one-guest note in bold (plain text can't be bold).
  const bodyHtml = body.replace(oneGuest, `<strong style="font-weight:700;">${oneGuest}</strong>`);
  return {
    subject,
    html: shell(
      subject,
      heading(`You are confirmed, ${name}.`) +
        para(lead, { italic: true }) +
        para(bodyHtml) +
        detailsBlock(),
    ),
    text:
      `You are confirmed, ${firstName}.\n\n${lead}\n\n${body}\n\n` +
      `${FF_EVENT.dateLong}\n${FF_EVENT.time}\n${FF_EVENT.venueName} · ${FF_EVENT.venueStreet}, ${FF_EVENT.venueArea}` +
      TEXT_FOOTER,
  };
}

/** Sent once when the organiser presses Decline (attending guests only). Warm, not a rejection. */
export function renderFfDeclinedEmail(firstName: string): EmailContent {
  const name = escapeHtml(firstName);
  const subject = 'An update on your Friends & Family RSVP';
  const lead = 'Thank you so much for wanting to spend the afternoon with us.';
  const body1 =
    'Our invitation travelled further than we expected, and with space at Kaya 959 limited to a small group, we were not able to include everyone on the final guest list. This means we cannot confirm a place for you on Sunday, 22 November, and we are truly sorry.';
  const body2 = `We would love to see you at the next You&Me gathering on ${FF_NEXT_EVENT.dateLong}. Tickets are on sale now.`;
  return {
    subject,
    html: shell(
      subject,
      heading(`Thank you, ${name}.`) +
        para(lead, { italic: true }) +
        para(body1) +
        para(body2) +
        buttonRow('BUY TICKETS', FF_NEXT_EVENT.ticketsUrl),
    ),
    text:
      `Thank you, ${firstName}.\n\n${lead}\n\n${body1}\n\n${body2}\n\nBuy tickets: ${FF_NEXT_EVENT.ticketsUrl}` +
      TEXT_FOOTER,
  };
}
