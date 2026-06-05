import type { Request, Response } from 'express';
import { detectActions } from './actions.js';
import { generateAnswer, type ChatTurn } from './answer.js';
import { retrieveChunks } from './retrieve.js';

const SUGGESTED = [
  'Add a Full Day Pass to my cart',
  'Where is the venue and how do I get there?',
  'Show my tickets',
  'What is included in Harvest Table?',
];

function isValidHistory(raw: unknown): raw is ChatTurn[] {
  if (!Array.isArray(raw)) return false;
  return raw.every(
    (t) =>
      t &&
      typeof t === 'object' &&
      (t.role === 'user' || t.role === 'assistant') &&
      typeof t.content === 'string' &&
      t.content.length <= 2000,
  );
}

export function createAssistantChatHandler() {
  return async (req: Request, res: Response): Promise<void> => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 800) {
      res.status(400).json({ error: 'Message is required (max 800 characters).' });
      return;
    }

    const history = isValidHistory(req.body?.history) ? req.body.history : [];

    try {
      const chunks = retrieveChunks(message, 1);
      const { answer, mode } = await generateAnswer(message, chunks, history);
      const actions = detectActions(message);

      res.json({
        answer,
        mode,
        sources: chunks.map((c) => ({ id: c.id, title: c.title })),
        suggested: SUGGESTED,
        actions,
      });
    } catch (err) {
      console.error('[assistant] chat failed', err);
      res.status(500).json({ error: 'Could not generate a reply. Try again shortly.' });
    }
  };
}

export function createAssistantMetaHandler() {
  return (_req: Request, res: Response): void => {
    res.json({
      name: 'You & Me guide',
      suggested: SUGGESTED,
      hasOpenAI: Boolean(process.env.OPENAI_API_KEY?.trim()),
    });
  };
}
