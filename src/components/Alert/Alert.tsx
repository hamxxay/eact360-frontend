import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';

/** Error band. `variant="band"` spans a panel (invoice list); `"inline"` sits inside a card (dashboard). */
export function Alert({ children, action, variant = 'inline' }: {
  children: ReactNode; action?: { label: string; onClick: () => void }; variant?: 'inline' | 'band';
}) {
  return (
    <div className={['e-alert', `e-alert-${variant}`].join(' ')} role="alert">
      <Icon name="bad" size={18} />
      <span>{children}</span>
      {action && <button type="button" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}
