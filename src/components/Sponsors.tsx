type SponsorsProps = {
  className?: string;
  /** Slightly smaller row (RSVP pages). */
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

const imageHeights = (compact: boolean, size: 'side' | 'center') => {
  if (size === 'center') {
    return compact
      ? 'h-[4.5rem] sm:h-[5.75rem] md:h-24'
      : 'h-24 sm:h-28 md:h-32 lg:h-36';
  }
  return compact
    ? 'h-14 sm:h-[4.25rem] md:h-20'
    : 'h-20 sm:h-24 md:h-28 lg:h-32';
};

export default function Sponsors({ className = '', compact = false }: SponsorsProps) {
  return (
    <div
      className={`flex w-full flex-col items-center gap-6 overflow-visible border-t border-brand-border/30 pt-10 ${className}`}
    >
      <div className="flex items-center gap-4 text-brand-muted">
        <span className="hidden h-px w-10 bg-brand-border sm:block" aria-hidden />
        <span className="text-center text-[9px] font-semibold uppercase tracking-[0.35em]">
          Partners &amp; Sponsors
        </span>
        <span className="hidden h-px w-10 bg-brand-border sm:block" aria-hidden />
      </div>

      <div
        className="flex w-full flex-nowrap items-end justify-between gap-3 overflow-visible px-0 sm:justify-center sm:gap-8 md:gap-12 lg:gap-16"
        role="list"
      >
        {SPONSORS.map((sponsor) => (
          <a
            key={sponsor.label}
            href={sponsor.href}
            role="listitem"
            aria-label={sponsor.label}
            className="block shrink-0 leading-none"
            {...(sponsor.external
              ? { target: '_blank', rel: 'noopener noreferrer sponsored' }
              : {})}
          >
            <img
              src={sponsor.src}
              alt={sponsor.alt}
              className={`w-auto max-w-none object-contain ${imageHeights(compact, sponsor.size)} ${sponsor.size === 'center' ? '-mx-1 sm:mx-0' : ''}`}
              decoding="async"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
