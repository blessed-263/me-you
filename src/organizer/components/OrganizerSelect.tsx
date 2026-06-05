import type { SelectHTMLAttributes } from 'react';

type Option = { value: string; label: string };

type OrganizerSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label: string;
  options: Option[];
  hideLabel?: boolean;
};

export default function OrganizerSelect({
  label,
  options,
  hideLabel = true,
  className = '',
  id,
  ...props
}: OrganizerSelectProps) {
  const selectId = id ?? `org-filter-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="organizer-select-wrap">
      <label htmlFor={selectId} className={hideLabel ? 'sr-only' : 'organizer-filter-label'}>
        {label}
      </label>
      <select id={selectId} className={`organizer-select ${className}`} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
