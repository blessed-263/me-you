import { motion } from 'motion/react';
import { Ticket } from 'lucide-react';
import type { EventInclusion, MockEvent } from '../lib/mockTickets.ts';
import { isEventEnded } from '../lib/eventLifecycle.ts';

type TicketEventHeroProps = {
  event: MockEvent;
  inclusions: EventInclusion[];
  pickHref: string;
};

/** Landscape image with inclusions sidebar. */
export default function TicketEventHero({ event, inclusions, pickHref }: TicketEventHeroProps) {
  const ended = isEventEnded(event);
  const items = inclusions ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden border border-brand-border bg-brand-surface shadow-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:min-h-[min(48vh,460px)]">
        <div className="relative aspect-[16/10] lg:aspect-auto lg:col-span-8 lg:min-h-[min(44vh,440px)] overflow-hidden">
          <img
            src={event.imageUrl}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover object-top ${ended ? 'grayscale-[0.35]' : ''}`}
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-text/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-brand-text/10" />
          {ended ? (
            <span className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.14em] font-semibold bg-brand-text/80 text-brand-bg px-3 py-1.5">
              Ended
            </span>
          ) : null}
        </div>

        <aside className="flex flex-col justify-between gap-8 p-8 md:p-9 lg:col-span-4 lg:p-10 border-t lg:border-t-0 lg:border-l border-brand-border bg-brand-bg/80">
          <ul className="space-y-7">
            {items.map((item) => (
              <li key={item.id} className="space-y-1.5">
                <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-brand-accent">{item.part}</p>
                <p className="font-serif text-xl font-semibold text-brand-text leading-snug">{item.title}</p>
                <p className="text-[13px] font-light leading-[1.7] text-brand-muted">{item.subtitle}</p>
              </li>
            ))}
          </ul>
          {ended ? (
            <p className="text-center text-sm font-light text-brand-muted leading-relaxed shrink-0">
              This edition has ended. Tickets are no longer on sale.
            </p>
          ) : (
            <a
              href={pickHref}
              className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors shrink-0"
            >
              <Ticket className="w-4 h-4" aria-hidden />
              Choose your experiences
            </a>
          )}
        </aside>
      </div>
    </motion.div>
  );
}
