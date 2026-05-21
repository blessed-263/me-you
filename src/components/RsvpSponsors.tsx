export default function RsvpSponsors() {
  return (
    <div className="flex flex-col items-center gap-6 w-full border-t border-brand-border/30 pt-10 mt-12">
      <div className="flex items-center gap-4 text-brand-muted">
        <span className="hidden sm:block w-10 h-px bg-brand-border" aria-hidden />
        <span className="text-[9px] uppercase tracking-[0.35em] text-center">Partners &amp; Sponsors</span>
        <span className="hidden sm:block w-10 h-px bg-brand-border" aria-hidden />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center justify-items-center gap-4 sm:gap-6 w-full">
        <a
          href="#"
          aria-label="Nela's Kitchen"
          className="flex items-center justify-center h-20 w-full max-w-36 sm:h-24 sm:max-w-44"
        >
          <img
            src="/sponsors/nelas brown .png"
            alt="Nela's Kitchen"
            className="max-h-full max-w-full object-contain object-center"
            decoding="async"
          />
        </a>
        <a
          href="https://www.martell.com"
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label="Martell"
          className="flex items-center justify-center h-28 w-full max-w-52 sm:h-32 sm:max-w-64"
        >
          <img
            src="/sponsors/martell brown .png"
            alt="Martell"
            className="max-h-full max-w-full object-contain object-center"
            decoding="async"
          />
        </a>
        <a
          href="https://www.stellaartois.com"
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label="Stella Artois"
          className="flex items-center justify-center h-20 w-full max-w-36 sm:h-24 sm:max-w-44"
        >
          <img
            src="/sponsors/stella brown .png"
            alt="Stella Artois"
            className="max-h-full max-w-full object-contain object-center"
            decoding="async"
          />
        </a>
      </div>
    </div>
  );
}
