import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../Loaders/Spinner';

type Variant = 'default' | 'primary' | 'ghost';
interface Common { variant?: Variant; children: ReactNode; className?: string; block?: boolean }

type AsButton = Common & ButtonHTMLAttributes<HTMLButtonElement> & { to?: never; href?: never; loading?: boolean; loadingText?: string };
type AsRoute = Common & { to: string; href?: never };
type AsLegacy = Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; to?: never };

export function Button(props: AsButton | AsRoute | AsLegacy) {
  const { variant = 'default', className, children, block } = props;
  const cls = ['e-btn', `e-btn-${variant}`, block && 'e-btn-block', className].filter(Boolean).join(' ');

  if ('to' in props && props.to) return <Link to={props.to} className={cls}>{children}</Link>;
  if ('href' in props && props.href) {
    const { variant: _v, className: _c, children: _ch, block: _b, ...rest } = props as AsLegacy;
    return <a {...rest} className={cls}>{children}</a>;
  }
  const { variant: _v, className: _c, children: _ch, block: _b, loading, loadingText, disabled, ...rest } = props as AsButton;
  return (
    <button type="button" {...rest} disabled={disabled || loading} aria-busy={loading || undefined} className={cls}>
      {loading && <Spinner size={16} />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
