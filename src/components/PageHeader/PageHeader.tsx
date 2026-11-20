import type { ReactNode } from 'react';

/* No label above the title: the engraved title carries its own weight (Intaglio). */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={'e-page-header-head'}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className={'e-page-header-actions'}>{actions}</div>}
    </section>
  );
}
