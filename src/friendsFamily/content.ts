/**
 * Friends & Family (Sunday, 22 November 2026): every event detail and line of
 * copy for the invite page and organiser view. Email copy lives in
 * server/friendsFamilyMeta.ts + server/friendsFamilyEmails.ts — keep them in step.
 */

/**
 * RSVPs closed (17 November 2026). The invite page shows the closed message and
 * a link to tickets for the next gathering instead of the form. The server also
 * refuses new RSVPs (server/friendsFamily.ts, unless FF_RSVP_OPEN=true).
 */
export const FF_RSVP_CLOSED = true;

export const FF_BASE_PATH = '/ff';
export const FF_ORGANISER_PATH = '/ff/organiser';
export const FF_STORAGE_KEY = 'yme-ff-rsvp-2026-11-22';

export const FF_IMAGES = {
  wordmark: { src: '/images/friends-family/youme-wordmark.png', width: 1000, height: 291 },
  martell: { src: '/images/friends-family/martell-logo.png', width: 640, height: 379 },
  title: { src: '/images/friends-family/ff-title.png', width: 1500, height: 619 },
  bgPhone: '/images/friends-family/bg-phone.jpg',
  bgWide: '/images/friends-family/bg-wide.jpg',
} as const;

export const FF_COPY = {
  invite: {
    wordmarkAlt: 'You&Me',
    withWord: 'with',
    martellAlt: 'Martell, Fondée en 1715',
    cross: '×',
    coHost: 'KAYA 959',
    present: 'PRESENT',
    titleAlt: 'Friends & Family',
    taglineA: 'An afternoon of good food, good music',
    taglineB: '& even better company.',
    dateA: 'SUNDAY,',
    dateB: '22 NOVEMBER 2026',
    time: '12:30 – 17:30',
    venueA: 'KAYA 959 · 195 JAN SMUT AVE',
    venueB: 'PARKTOWN NORTH',
    invitationOnly: 'BY INVITATION ONLY',
  },
  form: {
    heading: 'RSVP',
    intro: 'Kindly let us know if you will join us.',
    firstName: 'FIRST NAME',
    surname: 'SURNAME',
    mobile: 'MOBILE NUMBER',
    mobilePlaceholder: '+27 82 123 4567',
    email: 'EMAIL ADDRESS',
    question: 'WILL YOU BE JOINING US?',
    accept: 'Joyfully accepts',
    decline: 'Regretfully declines',
    submit: 'SEND RSVP',
    submitting: 'SENDING…',
    popia:
      'Your details are collected by the event hosts only to manage the guest list for this event, in line with POPIA. They will not be shared or used for marketing.',
  },
  errors: {
    firstNameEmpty: 'Please add your first name.',
    surnameEmpty: 'Please add your surname.',
    mobileEmpty: 'Please add your mobile number.',
    mobileInvalid: 'Use a South African mobile number, e.g. +27 82 123 4567.',
    emailEmpty: 'Please add your email address.',
    emailInvalid: 'Please check your email address.',
    attendingEmpty: 'Please let us know if you can make it.',
    saveFailed: 'Something went wrong sending your RSVP. Please try again in a moment.',
  },
  thanksYes: {
    label: 'RSVP RECEIVED',
    heading: (name: string) => (name ? `Thank you, ${name}.` : 'Thank you.'),
    lead: 'We look forward to sharing the afternoon with you on Sunday, 22 November.',
    body: 'As this is an invitation-only afternoon, your RSVP is now with the hosts for confirmation against the guest list. We will be in touch on the mobile number or email you shared.',
    detailsA: '12:30 – 17:30 · KAYA 959',
    detailsB: '195 JAN SMUT AVE, PARKTOWN NORTH',
    link: 'UPDATE MY RSVP',
  },
  thanksNo: {
    label: 'RSVP RECEIVED',
    heading: (name: string) => (name ? `Thank you, ${name}.` : 'Thank you for letting us know.'),
    lead: 'You will be missed. We hope to share good food, good music and even better company with you soon.',
    body: 'If your plans change, you can update your response here at any time.',
    link: 'CHANGE MY RESPONSE',
  },
  closed: {
    label: 'RSVP',
    heading: 'RSVPs are now closed.',
    lead: 'Thank you to everyone who responded.',
    body: 'Join us for the next You&Me gathering on Sunday, 6 December 2026. Tickets are on sale now.',
    button: 'BUY TICKETS',
    buttonLabel: 'Buy tickets for Sunday, 6 December 2026 on Howler (opens in a new tab)',
  },
  footer: {
    lineA: 'YOU&ME · MARTELL · KAYA 959',
    lineB: 'Not for sale to persons under the age of 18. Enjoy responsibly.',
  },
  gate: {
    label: 'BY INVITATION ONLY',
    body: 'This page is for invited guests. Please use the link from your invitation.',
    unreachable: 'We could not open the invitation just now. Please try again in a moment.',
  },
  organiser: {
    loginHeading: 'Guest list',
    loginSub: 'Friends & Family · Organiser access',
    passcode: 'PASSCODE',
    enter: 'ENTER',
    emptyPasscode: 'Enter the organiser passcode.',
    wrongPasscode: 'That passcode is not right.',
    tooMany: 'Too many attempts. Wait a few minutes and try again.',
    unreachable: 'Could not reach the guest list. Try again.',
    title: 'Friends & Family · Guest list',
    sub: 'Sunday, 22 November 2026 · 12:30 – 17:30 · Kaya 959, Parktown North',
    refresh: 'REFRESH',
    copyCsv: 'COPY CSV',
    downloadCsv: 'DOWNLOAD CSV',
    signOut: 'SIGN OUT',
    totals: ['RESPONSES', 'ATTENDING', 'NOT ATTENDING', 'AWAITING REVIEW', 'ARRIVED'],
    response: 'RESPONSE',
    status: 'STATUS',
    search: 'SEARCH',
    searchPlaceholder: 'Name, email or number',
    headings: ['GUEST', 'MOBILE', 'EMAIL', 'RESPONSE', 'RECEIVED', 'STATUS', 'GUEST LIST CHECK', 'DOOR'],
    attending: 'Attending',
    notAttending: 'Not attending',
    approve: 'Approve',
    decline: 'Decline',
    checkIn: 'Check in',
    undoCheckIn: 'Undo check-in',
    arrivedAt: (t: string) => `Arrived ${t}`,
    noneYet: 'No RSVPs yet. They will appear here as guests respond.',
    noneMatch: 'No RSVPs match these filters.',
    footer: (shown: number, total: number) =>
      `${shown} of ${total} shown · Personal information is handled under POPIA. Share exports only with people managing the door list.`,
    copied: (n: number) => `CSV copied (${n} rows). Paste it into Excel or Google Sheets.`,
    copyBlocked: 'Copy was blocked here, so the CSV is shown below to copy by hand.',
    saveFailed: 'Could not save that change. Try again.',
    refreshFailed: 'Could not refresh the list.',
    sessionEnded: 'Your session has ended. Enter the passcode again.',
    // Approve / Decline decision emails
    confirmTitleApprove: 'Approve guest',
    confirmTitleDecline: 'Decline guest',
    confirmSend: (name: string, email: string, d: 'approved' | 'declined') =>
      d === 'approved'
        ? `Send the "You are on the final guest list" email to ${name} (${email})?`
        : `Send the "not on the final guest list" email (with the 6 December ticket link) to ${name} (${email})?`,
    confirmNoEmailAlready: (name: string, d: 'approved' | 'declined', when: string) =>
      `${d === 'approved' ? 'Approve' : 'Decline'} ${name}? They were already emailed on ${when}, so no new email will be sent.`,
    confirmNoEmailNotAttending: (name: string, d: 'approved' | 'declined') =>
      `${d === 'approved' ? 'Approve' : 'Decline'} ${name}? They said they can't attend, so no email will be sent.`,
    send: 'SEND',
    cancel: 'CANCEL',
    retryEmail: 'Retry email',
    emailSent: (name: string, email: string) => `Saved. Email sent to ${name} (${email}).`,
    emailFailed: (name: string) =>
      `Status saved, but the email to ${name} was not sent. Press "Retry email" to try again.`,
    emailAlready: (name: string) => `Saved. ${name} was already emailed, so no new email was sent.`,
    emailNotAttending: (name: string) => `Saved. No email sent: ${name} said they can't attend.`,
    emailedAt: (when: string) => `Emailed ${when}`,
    emailNotSent: 'Email not sent',
    noEmailNotAttending: 'No email (not attending)',
  },
} as const;

export type FfForm = {
  firstName: string;
  surname: string;
  mobile: string;
  email: string;
  attending: boolean | null;
};

export type FfFormErrors = Partial<Record<keyof FfForm, string>>;

export const EMPTY_FORM: FfForm = { firstName: '', surname: '', mobile: '', email: '', attending: null };

const MOBILE_RE = /^(\+27|0)[6-8]\d{8}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normaliseSaMobile(raw: string): string | null {
  const compact = raw.trim().replace(/[\s()-]/g, '');
  if (!MOBILE_RE.test(compact)) return null;
  return compact.startsWith('0') ? `+27${compact.slice(1)}` : compact;
}

/** Same rules as the server (server/friendsFamilyMeta.ts). */
export function validateForm(form: FfForm): FfFormErrors {
  const e = FF_COPY.errors;
  const errors: FfFormErrors = {};
  const first = form.firstName.trim();
  const last = form.surname.trim();
  const mobile = form.mobile.trim();
  const email = form.email.trim();
  if (!first) errors.firstName = e.firstNameEmpty;
  if (!last) errors.surname = e.surnameEmpty;
  if (!mobile) errors.mobile = e.mobileEmpty;
  else if (!normaliseSaMobile(mobile)) errors.mobile = e.mobileInvalid;
  if (!email) errors.email = e.emailEmpty;
  else if (!EMAIL_RE.test(email)) errors.email = e.emailInvalid;
  if (form.attending === null) errors.attending = e.attendingEmpty;
  return errors;
}

export const FIELD_ORDER: (keyof FfForm)[] = ['firstName', 'surname', 'mobile', 'email', 'attending'];
