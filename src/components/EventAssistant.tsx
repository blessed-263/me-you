import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import {
  fetchAssistantMeta,
  sendAssistantMessage,
  type AssistantMessage,
} from '../lib/assistantApi.ts';
import { actionButtons, type AssistantAction } from '../lib/assistantIntents.ts';
import { addTicketToCart } from '../lib/assistantCart.ts';

function renderAnswerText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-brand-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

async function runActions(actions: AssistantAction[]): Promise<string | null> {
  const addActions = actions.filter((a) => a.type === 'add_to_cart');
  if (addActions.length === 0) return null;
  const notes: string[] = [];
  for (const a of addActions) {
    if (a.type !== 'add_to_cart') continue;
    const result = await addTicketToCart(a.ticketId, a.quantity);
    if (result.ok) notes.push(`Added ${a.quantity}× ${a.ticketName} to your cart.`);
    else notes.push('error' in result ? result.error : 'Could not add to cart.');
  }
  return notes.join(' ');
}

export default function EventAssistant() {
  const [open, setOpen] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi — I\'m your You & Me guide. Ask about the event, or ask me to add tickets to your cart, open My tickets, or get directions.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<{ id: string; title: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) fetchAssistantMeta().then((m) => setSuggested(m.suggested));
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: AssistantMessage = { role: 'user', content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendAssistantMessage(trimmed, messages);
      setSources(res.sources);

      const cartNote = await runActions(res.actions.filter((a) => a.type === 'add_to_cart'));
      let answer = res.answer;
      if (cartNote?.includes('Added')) {
        answer = `${cartNote} Open **Get tickets** when you're ready to review and checkout.`;
      }

      setMessages((m) => [
        ...m,
        { role: 'assistant', content: answer, actions: res.actions },
      ]);
      if (res.suggested?.length) setSuggested(res.suggested);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: AssistantAction) => {
    if (action.type === 'navigate') {
      if (action.href.startsWith('http')) {
        window.open(action.href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = action.href;
      }
      return;
    }
    if (action.type === 'add_to_cart') {
      void runActions([action]).then((note) => {
        if (note) setMessages((m) => [...m, { role: 'assistant', content: note }]);
      });
    }
  };

  return (
    <div className="event-assistant fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
      {open ? (
        <div
          className="event-assistant-panel w-[min(100vw-2rem,400px)] flex flex-col overflow-hidden rounded-sm border border-brand-border bg-brand-bg shadow-xl"
          role="dialog"
          aria-label="Event assistant"
        >
          <header className="flex items-start justify-between gap-3 px-4 py-4 border-b border-brand-border bg-white/80">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-brand-accent">
                You & Me guide
              </p>
              <p className="mt-1 font-serif text-lg text-brand-text leading-snug">Ask or get things done</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 p-1 text-brand-muted hover:text-brand-text"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="event-assistant-messages flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[220px] max-h-[min(50vh,360px)]"
          >
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'ml-8' : 'mr-2'}>
                <div
                  className={`text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-sm bg-brand-text text-brand-bg px-3 py-2.5'
                      : 'text-brand-muted'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="whitespace-pre-wrap">{renderAnswerText(msg.content)}</div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.actions
                      .filter((a) => a.type === 'add_to_cart')
                      .map((a) => (
                        <button
                          key={`add-${a.ticketId}`}
                          type="button"
                          onClick={() => handleAction(a)}
                          className="text-[10px] uppercase tracking-[0.12em] font-semibold px-3 py-2 rounded-full border border-brand-accent/40 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 transition-colors"
                        >
                          Add {a.quantity}× {a.ticketName}
                        </button>
                      ))}
                    {actionButtons(msg.actions).map((a) =>
                      a.type === 'navigate' ? (
                        <button
                          key={a.href}
                          type="button"
                          onClick={() => handleAction(a)}
                          className="text-[10px] uppercase tracking-[0.12em] font-semibold px-3 py-2 rounded-full border border-brand-border bg-white/80 text-brand-text hover:border-brand-accent/40 transition-colors"
                        >
                          {a.label}
                        </button>
                      ) : null,
                    )}
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? (
              <p className="text-[11px] uppercase tracking-[0.12em] text-brand-muted animate-pulse">
                Looking that up…
              </p>
            ) : null}
          </div>

          {sources[0] ? (
            <p className="px-4 pb-2 text-[9px] uppercase tracking-[0.1em] text-brand-muted border-t border-brand-border/50 pt-2">
              Source: {sources[0].title}
            </p>
          ) : null}

          {suggested.length > 0 && messages.length < 5 ? (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {suggested.slice(0, 4).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="text-left text-[10px] leading-snug px-3 py-2 rounded-full border border-brand-border bg-white/70 text-brand-muted hover:text-brand-text hover:border-brand-accent/40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="border-t border-brand-border p-3 bg-white/60 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <label htmlFor="assistant-input" className="sr-only">
              Your question
            </label>
            <input
              id="assistant-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask or say “add full day to cart”…"
              className="rsvp-field flex-1 min-w-0 text-sm py-2.5"
              disabled={loading}
              maxLength={800}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-text text-brand-bg disabled:opacity-40 hover:bg-brand-text/90 transition-colors"
              aria-label="Send"
            >
              <Send className="w-4 h-4" aria-hidden />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`event-assistant-fab flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-[1.02] ${
          open ? 'h-12 w-12 bg-brand-text text-brand-bg' : 'h-[3.75rem] w-[3.75rem] bg-brand-bg border-2 border-brand-border p-2'
        }`}
        aria-expanded={open}
        aria-label={open ? 'Close guide' : 'Open You & Me guide'}
      >
        {open ? (
          <X className="w-5 h-5" aria-hidden />
        ) : (
          <img src="/favicon.png" alt="" className="w-full h-full object-contain" draggable={false} />
        )}
      </button>
    </div>
  );
}
