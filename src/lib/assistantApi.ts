import { apiUrl } from './api.ts';
import type { AssistantAction } from './assistantIntents.ts';
import { detectAssistantActions } from './assistantIntents.ts';
import { ASSISTANT_SUGGESTED, clientFallbackAnswer } from './ragClient.ts';

export type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
  actions?: AssistantAction[];
};

export type AssistantChatResponse = {
  answer: string;
  mode: 'openai' | 'extractive';
  sources: { id: string; title: string }[];
  suggested: string[];
  actions: AssistantAction[];
};

export async function fetchAssistantMeta(): Promise<{
  suggested: string[];
  hasOpenAI: boolean;
}> {
  try {
    const res = await fetch(apiUrl('/api/assistant/meta'));
    if (!res.ok) throw new Error('meta failed');
    const data = (await res.json()) as { suggested?: string[]; hasOpenAI?: boolean };
    return {
      suggested: data.suggested ?? [...ASSISTANT_SUGGESTED],
      hasOpenAI: Boolean(data.hasOpenAI),
    };
  } catch {
    return { suggested: [...ASSISTANT_SUGGESTED], hasOpenAI: false };
  }
}

function mergeActions(server: AssistantAction[] | undefined, message: string): AssistantAction[] {
  const local = detectAssistantActions(message);
  const seen = new Set<string>();
  const merged: AssistantAction[] = [];
  for (const a of [...(server ?? []), ...local]) {
    const key = a.type === 'navigate' ? `nav:${a.href}` : `add:${a.ticketId}:${a.quantity}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(a);
  }
  return merged;
}

export async function sendAssistantMessage(
  message: string,
  history: AssistantMessage[],
): Promise<AssistantChatResponse> {
  try {
    const res = await fetch(apiUrl('/api/assistant/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error('chat failed');
    const data = (await res.json()) as AssistantChatResponse;
    return { ...data, actions: mergeActions(data.actions, message) };
  } catch {
    const fallback = clientFallbackAnswer(message);
    return {
      answer: fallback.answer,
      mode: 'extractive',
      sources: fallback.sources,
      suggested: [...ASSISTANT_SUGGESTED],
      actions: detectAssistantActions(message),
    };
  }
}
