import { ASSISTANT_SUGGESTED, EVENT_KNOWLEDGE, type KnowledgeChunk } from './eventKnowledge.ts';

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'to', 'for', 'of', 'in', 'on', 'with', 'at', 'and', 'or', 'i', 'my', 'how', 'what', 'when', 'where']);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function retrieve(query: string, limit = 1): (KnowledgeChunk & { score: number })[] {
  const terms = tokenize(query);
  if (terms.length === 0) return EVENT_KNOWLEDGE.slice(0, limit).map((c) => ({ ...c, score: 0 }));

  return EVENT_KNOWLEDGE.map((chunk) => {
    const hay = `${chunk.title} ${chunk.text} ${chunk.tags.join(' ')}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (chunk.title.toLowerCase().includes(term)) score += 3;
      score += hay.split(term).length - 1;
    }
    return { ...chunk, score };
  })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function clientFallbackAnswer(query: string): {
  answer: string;
  sources: { id: string; title: string }[];
} {
  const chunks = retrieve(query, 1);
  const top = chunks[0];
  if (!top) {
    return {
      answer:
        'I can help with dates, venue, ticket types, prices, sign-in, and My tickets. Ask something specific about the gathering.',
      sources: [],
    };
  }
  return {
    answer: `${top.title}: ${top.text.split('\n')[0]}\n\nTo book, go to Tickets and sign in first.`,
    sources: [{ id: top.id, title: top.title }],
  };
}

export { ASSISTANT_SUGGESTED };
