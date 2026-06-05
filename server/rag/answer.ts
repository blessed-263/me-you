import type { RetrievedChunk } from './retrieve.js';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

function topChunk(chunks: RetrievedChunk[]): RetrievedChunk | null {
  return chunks[0] ?? null;
}

function buildContext(chunk: RetrievedChunk): string {
  return `[${chunk.title}]\n${chunk.text}`;
}

/** Compose a reply from the single top retrieved chunk */
export function composeExtractiveAnswer(_query: string, chunks: RetrievedChunk[]): string {
  const chunk = topChunk(chunks);
  if (!chunk) {
    return `I don't have specific details on that in our event guide yet. Try asking about dates, venue, ticket types, how to buy, or My tickets — or contact the You & Me team through the main site.`;
  }

  const lead = chunk.text.split('\n')[0].trim();
  const body = `**${chunk.title}** — ${lead}`;

  if (chunk.id.startsWith('ticket-') || chunk.id === 'purchase' || chunk.id === 'my-tickets') {
    return `${body}\n\nSign in on the ticket page to purchase, or open **My tickets** after checkout.`;
  }

  return `${body}\n\nAsk another question, or say "add full day to cart" / "show my tickets" if you want me to help with that.`;
}

async function answerWithOpenAI(
  query: string,
  chunks: RetrievedChunk[],
  history: ChatTurn[],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const chunk = topChunk(chunks);
  if (!apiKey || !chunk) return composeExtractiveAnswer(query, chunks);

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const context = buildContext(chunk);

  const messages: { role: string; content: string }[] = [
    {
      role: 'system',
      content: `You are the You & Me Africa event assistant. Answer warmly and concisely in plain language (no markdown headers unless listing a price). Use ONLY the single context passage below — do not combine other topics. If the answer is not in context, say you are not sure and suggest the tickets page or contacting the team. Do not invent prices or dates.

Context:
${context}`,
    },
    ...history.slice(-6).map((t) => ({ role: t.role, content: t.content })),
    { role: 'user', content: query },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.35,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn('[rag] OpenAI error', res.status, errText.slice(0, 200));
    return composeExtractiveAnswer(query, chunks);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || composeExtractiveAnswer(query, chunks);
}

export async function generateAnswer(
  query: string,
  chunks: RetrievedChunk[],
  history: ChatTurn[] = [],
): Promise<{ answer: string; mode: 'openai' | 'extractive' }> {
  const useOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  if (useOpenAI) {
    const answer = await answerWithOpenAI(query, chunks, history);
    return { answer, mode: 'openai' };
  }
  return { answer: composeExtractiveAnswer(query, chunks), mode: 'extractive' };
}
