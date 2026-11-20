import type { ReactNode } from 'react';

interface Props {
  title?: ReactNode;
  note?: ReactNode;   // small text at the right of the title, e.g. units or period
  children: ReactNode;
  className?: string;
  flush?: boolean;    // no padding (panels holding tables)
  as?: 'section' | 'div' | 'article';
}

export function Card({ title, note, children, className, flush, as: Tag = 'section' }: Props) {
  return (
    <Tag className={['e-card', flush && 'e-card-flush', className].filter(Boolean).join(' ')}>
      {title && (
        <h2 className={'e-card-title'}>
          {title}
          {note && <small>{note}</small>}
        </h2>
      )}
      {children}
    </Tag>
  );
}
