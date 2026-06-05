import { KNOWLEDGE_CHUNKS, type KnowledgeChunk } from './knowledge.js';

const STOP = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
  'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because',
  'until', 'while', 'about', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'they', 'their', 'he', 'she',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export type RetrievedChunk = KnowledgeChunk & { score: number };

/** Returns only the single best-matching knowledge chunk */
export function retrieveChunks(query: string, limit = 1): RetrievedChunk[] {
  const terms = tokenize(query);
  if (terms.length === 0) {
    return KNOWLEDGE_CHUNKS.slice(0, limit).map((c) => ({ ...c, score: 0 }));
  }

  const scored = KNOWLEDGE_CHUNKS.map((chunk) => {
    const hay = `${chunk.title} ${chunk.text} ${chunk.tags.join(' ')}`.toLowerCase();
    const titleHay = chunk.title.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (titleHay.includes(term)) score += 3;
      if (chunk.tags.some((tag) => tag.includes(term) || term.includes(tag))) score += 2;
      const matches = hay.split(term).length - 1;
      if (matches > 0) score += matches;
    }
    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
