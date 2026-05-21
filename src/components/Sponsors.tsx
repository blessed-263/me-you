type SponsorsProps = {
  className?: string;
  /** Slightly smaller row (RSVP pages); Martell stays visually dominant. */
  compact?: boolean;
};

const sideSlot = (compact: boolean) =>
  compact
    ? 'h-[3.25rem] w-[7.5rem] sm:h-16 sm:w-[8.5rem]'
    : 'h-20 w-[8.5rem] sm:h-24 sm:w-40 md:h-28 md:w-44';

const martellSlot = (compact: boolean) =>
  compact
    ? 'h-[5.5rem] w-[11rem] sm:h-28 sm:w-[13.5rem]'
    : 'h-32 w-[12rem] sm:h-40 sm:w-[15rem] md:h-48 md:w-[18rem]';

function SponsorLogo({
  href,
  label,
  src,
  alt,
  slotClass,
  external,
}: {
  href: string;
  label: string;
  src: string;
  alt: string;
  slotClass: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className={`flex shrink-0 items-center justify-center ${slotClass}`}
      {...(external
        ? { target: '_blank', rel: 'noopener noreferrer sponsored' }
        : {})}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain object-center"
        decoding="async"
      />
    </a>
  );
}

export default function Sponsors({ className = '', compact = false }: SponsorsProps) {
  const side = sideSlot(compact);
  const martell = martellSlot(compact);

  return (
    <div
      className={`flex flex-col items-center gap-6 w-full border-t border-brand-border/30 pt-10 ${className}`}
    >
      <div className="flex items-center gap-4 text-brand-muted">
        <span className="hidden sm:block w-10 h-px bg-brand-border" aria-hidden />
        <span className="text-[9px] uppercase tracking-[0.35em] text-center">
          Partners &amp; Sponsors
        </span>
        <span className="hidden sm:block w-10 h-px bg-brand-border" aria-hidden />
      </div>

      <div className="flex w-full max-w-4xl flex-wrap items-end justify-center gap-x-10 gap-y-8 sm:gap-x-14 md:gap-x-20 px-2">
        <SponsorLogo
          href="#"
          label="Nela's Kitchen"
          src="/sponsors/nelas brown .png"
          alt="Nela's Kitchen"
          slotClass={side}
        />
        <SponsorLogo
          href="https://www.martell.com"
          label="Martell"
          src="/sponsors/martell brown .png"
          alt="Martell"
          slotClass={martell}
          external
        />
        <SponsorLogo
          href="https://www.stellaartois.com"
          label="Stella Artois"
          src="/sponsors/stella brown .png"
          alt="Stella Artois"
          slotClass={side}
          external
        />
      </div>
    </div>
  );
}
