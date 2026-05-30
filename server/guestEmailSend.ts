import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { GuestBroadcastContent } from './emailTemplates.js';
import { renderGuestBroadcastEmail } from './emailTemplates.js';

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
};

/** Inline local hero images as CID attachments so mobile inboxes load them reliably. */
export function prepareGuestEmailSend(
  content: GuestBroadcastContent,
  guestName?: string,
): { html: string; attachments: GuestEmailAttachment[] } {
  const attachments: GuestEmailAttachment[] = [];
  let heroImageUrl = content.heroImageUrl;

  for (const [needle, { file, cid }] of Object.entries(INLINE_HERO_FILES)) {
    if (!heroImageUrl.includes(needle)) continue;
    const filePath = path.join(ROOT, file);
    if (!existsSync(filePath)) break;
    attachments.push({
      filename: path.basename(filePath),
      content: readFileSync(filePath),
      contentId: cid,
    });
    heroImageUrl = `cid:${cid}`;
    break;
  }

  const html = renderGuestBroadcastEmail(
    { ...content, heroImageUrl },
    guestName,
  );

  return { html, attachments };
}
