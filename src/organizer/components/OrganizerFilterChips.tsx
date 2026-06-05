type OrganizerFilterChipsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
};

export default function OrganizerFilterChips<T extends string>({
  value,
  onChange,
  options,
}: OrganizerFilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] border transition-colors ${
              active
                ? 'bg-brand-text text-brand-bg border-brand-text'
                : 'border-brand-border text-brand-muted hover:text-brand-text bg-white/80'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
