import { Check } from 'lucide-react';

const STEPS = [
  { id: 'select', label: 'Tickets' },
  { id: 'checkout', label: 'Details' },
  { id: 'payment', label: 'Payment' },
  { id: 'success', label: 'Done' },
] as const;

export type TicketStepId = (typeof STEPS)[number]['id'];

export default function StepIndicator({ current }: { current: TicketStepId }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Checkout progress" className="w-full max-w-md mx-auto">
      <ol className="flex items-center justify-between gap-1">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={step.id} className="flex flex-1 flex-col items-center gap-2 min-w-0">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div
                    className={`h-px flex-1 ${done || active ? 'bg-brand-accent' : 'bg-brand-border'}`}
                    aria-hidden
                  />
                )}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold transition-colors ${
                    done
                      ? 'border-brand-accent bg-brand-accent text-brand-bg'
                      : active
                        ? 'border-brand-text bg-brand-text text-brand-bg'
                        : 'border-brand-border bg-brand-bg text-brand-muted'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" aria-hidden /> : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-px flex-1 ${done ? 'bg-brand-accent' : 'bg-brand-border'}`}
                    aria-hidden
                  />
                )}
              </div>
              <span
                className={`text-[8px] uppercase tracking-[0.14em] font-semibold truncate w-full text-center ${
                  active ? 'text-brand-text' : done ? 'text-brand-accent' : 'text-brand-muted/70'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
