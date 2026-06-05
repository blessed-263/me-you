type AmpexWordmarkProps = {
  className?: string;
  size?: 'sm' | 'md';
};

/** AmpEx text logo — matches ampex.store wordmark styling. */
export default function AmpexWordmark({ className = '', size = 'md' }: AmpexWordmarkProps) {
  const textSize = size === 'sm' ? 'text-base' : 'text-xl';
  return (
    <span
      className={`inline-flex items-center gap-2 font-sans font-bold tracking-tighter ${textSize} ${className}`}
      aria-label="AmpEx"
    >
      <span className="w-2 h-2 bg-brand-accent rounded-sm rotate-45 shrink-0" aria-hidden />
      <span>
        <span className="text-brand-text">a</span>
        <span className="text-brand-text/55">m</span>
        <span className="text-brand-text/55">p</span>
        <span className="text-brand-text">e</span>
        <span className="text-brand-text/55">x</span>
        <span className="text-brand-accent">.</span>
      </span>
    </span>
  );
}
