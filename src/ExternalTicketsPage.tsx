import { Ticket, ArrowUpRight } from 'lucide-react';
import SiteNavAuth from './components/SiteNavAuth.tsx';
import {
  EXTERNAL_TICKETS_URL,
  isAmpExEnabled,
  trackOutboundClick,
} from './lib/siteConfig.ts';

export default function ExternalTicketsPage() {
  if (isAmpExEnabled) return null;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-brand-text">
      <header className="sticky top-0 z-[60] bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border shadow-sm">
        <nav className="px-5 py-4 md:px-12 md:py-5 flex justify-between items-center gap-4">
          <a href="/" className="shrink-0 flex items-center group">
            <img
              src="/sponsors/youandme white.png"
              alt="You & Me Africa"
              className="h-9 w-auto md:h-10 object-contain invert group-hover:opacity-80 transition-opacity duration-300"
            />
          </a>
          <SiteNavAuth variant="marketing" />
        </nav>
      </header>

      <main className="px-5 md:px-12 py-16 md:py-24 max-w-2xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-brand-accent">
          Tickets
        </p>
        <h1 className="mt-4 font-serif text-3xl md:text-5xl font-semibold text-brand-text text-balance">
          Get your tickets on Howler
        </h1>
        <p className="mt-6 text-sm md:text-base font-light text-brand-muted leading-relaxed">
          Ticket sales for You &amp; Me Africa are handled securely on Howler. Choose your experience,
          complete checkout, and your tickets will be emailed to you.
        </p>
        <a
          href={EXTERNAL_TICKETS_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackOutboundClick('howler_tickets')}
          className="mt-10 inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 transition-colors"
        >
          <Ticket className="w-4 h-4" aria-hidden />
          Buy on Howler
          <ArrowUpRight className="w-4 h-4" aria-hidden />
        </a>
        <p className="mt-8 text-[10px] uppercase tracking-[0.14em] text-brand-muted">
          You will leave youandmeafrica.com
        </p>
        <a
          href="/"
          className="mt-10 inline-block text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-accent hover:text-brand-text transition-colors"
        >
          ← Back to home
        </a>
      </main>
    </div>
  );
}
