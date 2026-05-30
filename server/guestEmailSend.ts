import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type {
  GuestBroadcastContent,
  PersonalLetterContent,
} from './emailTemplates.js';
import {
  renderGuestBroadcastEmail,
  renderPersonalLetterEmail,
  renderPersonalLetterPlainText,
} from './emailTemplates.js';

const ROOT = path.resolve(import.meta.dirname, '..');

export type GuestEmailAttachment = {
  filename: string;
  content: Buffer;
  contentId: string;
};

const INLINE_HERO_FILES: Record<string, { file: string; cid: string }> = {
  'email-hero-harvest.jpg': {
    file: 'public/images/email-hero-harvest.jpg',
    cid: 'hero-harvest',
  },
  'email-hero-harvest-table.png': {
    file: 'public/images/email-hero-harvest-table.png',
    cid: 'hero-harvest-table',
  },
  'email-hero-after-party.jpg': {
    file: 'public/images/email-hero-after-party.jpg',
    cid: 'hero-after-party',
  },
  'email-hero-youandme.png': {
    file: 'public/images/email-hero-youandme.png',
    cid: 'hero-youandme',
  },
  'email-may-gathering-poster.png': {
    file: 'public/images/email-may-gathering-poster.png',
    cid: 'hero-may-gathering',
  },
};

function inlineHeroAttachments(heroImageUrl: string): {
  heroImageUrl: string;
  attachments: GuestEmailAttachment[];
} {
  const attachments: GuestEmailAttachment[] = [];
  let url = heroImageUrl;

  for (const [needle, { file, cid }] of Object.entries(INLINE_HERO_FILES)) {
    if (!url.includes(needle)) continue;
    const filePath = path.join(ROOT, file);
    if (!existsSync(filePath)) break;
    attachments.push({
      filename: path.basename(filePath),
      content: readFileSync(filePath),
      contentId: cid,
    });
    url = `cid:${cid}`;
    break;
  }

  return { heroImageUrl: url, attachments };
}

/** Inline local hero images as CID attachments so mobile inboxes load them reliably. */
export function prepareGuestEmailSend(
  content: GuestBroadcastContent,
  guestName?: string,
): { html: string; attachments: GuestEmailAttachment[] } {
  const { heroImageUrl, attachments } = inlineHeroAttachments(
    content.heroImageUrl,
  );

  const html = renderGuestBroadcastEmail(
    { ...content, heroImageUrl },
    guestName,
  );

  return { html, attachments };
}

export function preparePersonalLetterEmailSend(
  content: PersonalLetterContent,
  guestName?: string,
): { html: string | null; text: string; attachments: GuestEmailAttachment[] } {
  const text = renderPersonalLetterPlainText(content, guestName);

  if (content.plainTextOnly) {
    return { html: null, text, attachments: [] };
  }

  const heroImageUrl = content.heroImageUrl ?? '';
  const { heroImageUrl: resolvedHero, attachments } = heroImageUrl
    ? inlineHeroAttachments(heroImageUrl)
    : { heroImageUrl: '', attachments: [] as GuestEmailAttachment[] };

  const resolved = { ...content, heroImageUrl: resolvedHero || undefined };
  const html = renderPersonalLetterEmail(resolved, guestName);

  return { html, text, attachments };
}
