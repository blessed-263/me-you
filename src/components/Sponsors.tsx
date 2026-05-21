type SponsorsProps = {
  className?: string;
  /** Slightly smaller row (RSVP pages); Martell stays visually dominant. */
  compact?: boolean;
};

type SponsorItem = {
  href: string;
  label: string;
  src: string;
  alt: string;
  external?: boolean;
  size: 'side' | 'center';
};

const SPONSORS: SponsorItem[] = [
  {
    href: '#',
    label: "Nela's Kitchen",
    src: '/sponsors/nelas brown .png',
    alt: "Nela's Kitchen",
    size: 'side',
  },
  {
    href: 'https://www.martell.com',
    label: 'Martell',
    src: '/sponsors/martell brown .png',
    alt: 'Martell',
    external: true,
    size: 'center',
  },
  {
    href: 'https://www.stellaartois.com',
    label: 'Stella Artois',
    src: '/sponsors/stella brown .png',
    alt: 'Stella Artois',
    external: true,
    size: 'side',
  },
];

const rowHeights = (compact: boolean) =>
  compact ? 'h-[4.5rem] sm:h-20' : 'h-20 sm:h-24 md:h-28';

const imageHeights = (compact: boolean, size: 'side' | 'center') => {
  if (size === 'center') {
    return compact
      ? 'max-h-[3.25rem] sm:max-h-[4.25rem]'
      : 'max-h-[4.5rem] sm:max-h-[5.5rem] md:max-h-[6.75rem]';
  }
  return compact
    ? 'max-h-[2.5rem] sm:max-h-[3rem]'
    : 'max-h-[3rem] sm:max-h-[3.5rem] md:max-h-16';
};

export default function Sponsors({ className = '', compact = false }: SponsorsProps) {
  const row = rowHeights(compact);

  return (
    <div
      className={`flex w-full flex-col items-center gap-6 border-t border-brand-border/30 pt-10 ${className}`}
    >
      <div className="flex items-center gap-4 text-brand-muted">
        <span className="hidden h-px w-10 bg-brand-border sm:block" aria-hidden />
        <span className="text-center text-[9px] font-semibold uppercase tracking-[0.35em]">
          Partners &amp; Sponsors
        </span>
        <span className="hidden h-px w-10 bg-brand-border sm:block" aria-hidden />
      </div>

      <div
        className={`grid w-full max-w-2xl grid-cols-3 items-center gap-2 px-1 sm:max-w-3xl sm:gap-6 md:max-w-4xl md:gap-10 ${compact ? 'max-w-lg sm:max-w-xl' : ''}`}
        role="list"
      >
        {SPONSORS.map((sponsor) => (
          <div
            key={sponsor.label}
            role="listitem"
            className={`flex min-w-0 items-center justify-center ${row}`}
          >
            <a
              href={sponsor.href}
              aria-label={sponsor.label}
              className="flex h-full w-full max-w-[92%] items-center justify-center sm:max-w-full"
              {...(sponsor.external
                ? { target: '_blank', rel: 'noopener noreferrer sponsored' }
                : {})}
            >
              <img
                src={sponsor.src}
                alt={sponsor.alt}
                className={`w-auto max-w-full object-contain object-center ${imageHeights(compact, sponsor.size)}`}
                decoding="async"
              />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
