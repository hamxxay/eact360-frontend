import { useEffect, useId, useState, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';

/** Table toolbar: filter chips on the left, an optional search box on the right. */
export function FilterBar({ children, search }: { children: ReactNode; search?: ReactNode }) {
  return (
    <div className={'e-filters-bar'}>
      <div className={'e-filters-chips'} role="group" aria-label="Filters">{children}</div>
      {search && <div className={'e-filters-search-slot'}>{search}</div>}
    </div>
  );
}

export interface Option { value: string; label: string }

/** Native select styled as a "Label Value" chip, so keyboard and screen readers work unchanged. */
export function Select({ label, value, options, onChange }: {
  label: string; value: string; options: Option[]; onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <span className={'e-filters-sel'}>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </span>
  );
}

/** Search box for a table. Updates after a short pause in typing. */
export function SearchField({ value, onChange, placeholder = 'Search…', label }: {
  value: string; onChange: (v: string) => void; placeholder?: string; label: string;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  useEffect(() => {
    if (text === value) return;
    const t = setTimeout(() => onChange(text), 250);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <span className={'e-filters-search'}>
      <Icon name="search" size={16} />
      <label htmlFor={id} className="visually-hidden">{label}</label>
      <input id={id} type="search" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
      {text && (
        <button type="button" onClick={() => { setText(''); onChange(''); }} aria-label="Clear search">
          <Icon name="close" size={14} />
        </button>
      )}
    </span>
  );
}
