type ResponsiveImageProps = {
  /** Path without extension, e.g. /images/harvest-table */
  base: string;
  alt: string;
  sizes: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  widths?: readonly number[];
};

const DEFAULT_WIDTHS = [640, 960, 1280, 2048] as const;

function buildSrcSet(base: string, ext: 'webp' | 'jpg', widths: readonly number[]): string {
  return widths.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');
}

export default function ResponsiveImage({
  base,
  alt,
  sizes,
  className,
  loading = 'lazy',
  priority = false,
  widths = DEFAULT_WIDTHS,
}: ResponsiveImageProps) {
  const fallbackWidth = widths.includes(1280) ? 1280 : widths[widths.length - 1]!;

  return (
    <picture className="block size-full">
      <source type="image/webp" srcSet={buildSrcSet(base, 'webp', widths)} sizes={sizes} />
      <img
        src={`${base}-${fallbackWidth}.jpg`}
        srcSet={buildSrcSet(base, 'jpg', widths)}
        sizes={sizes}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : loading}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        draggable={false}
      />
    </picture>
  );
}
