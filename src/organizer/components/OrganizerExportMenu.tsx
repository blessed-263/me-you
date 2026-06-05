import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';

export type ExportAction = {
  id: string;
  label: string;
  onClick: () => void;
};

type OrganizerExportMenuProps = {
  actions: ExportAction[];
  label?: string;
};

export default function OrganizerExportMenu({ actions, label = 'Export' }: OrganizerExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="organizer-export-menu relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center gap-2 h-10 rounded-full px-5 text-[10px] font-semibold uppercase tracking-[0.14em] bg-brand-text text-brand-bg hover:bg-brand-text/90 shadow-sm"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Download className="w-3.5 h-3.5" aria-hidden />
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open ? (
        <ul
          className="organizer-export-menu__panel absolute right-0 top-full z-20 mt-2 min-w-[200px] py-1"
          role="menu"
        >
          {actions.map((action) => (
            <li key={action.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-brand-text hover:bg-brand-surface/60 transition-colors"
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
