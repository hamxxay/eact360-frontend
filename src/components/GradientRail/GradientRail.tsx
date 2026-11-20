import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { findNavItem, useNav, type NavGroup, type NavItem } from '../../app/nav';
import { Icon, type IconName } from '../Icon/Icon';
import { Skeleton } from '../Loaders/Skeleton';

/* Icon rail ("gradient sidebar"): a fixed 92px column of round icon buttons. Hover or keyboard focus widens a
   button from a circle to a pill that shows its label and overlays the page (it never pushes the layout).
   A top-level link goes straight to its route. A module (a menu group with many pages) opens a fly-out list of
   its pages. Below 640px the same element becomes a bottom bar of icons only (no hover on touch). */

interface Entry {
  key: string;
  label: string;
  icon?: IconName;
  hue: number;
  item?: NavItem;     // direct link
  group?: NavGroup;   // module with a fly-out
}

const MODULE_ICON: [RegExp, IconName][] = [
  [/compan|organi|branch/i, 'building'],
  [/setting|config|admin|setup|utilit/i, 'settings'],
  [/audit|secur|right|permission/i, 'shield'],
  [/budget|bank|cash|treasur|fund/i, 'wallet'],
  [/master|document|file|archive/i, 'folder'],
  [/account|financ|ledger|voucher/i, 'accounts'],
  [/complian|fbr|tax/i, 'fbr'],
  [/people|hr\b|payroll|employee|staff/i, 'people'],
  [/sale|receivable|customer/i, 'sales'],
  [/purchas|procure|payable|vendor/i, 'purchases'],
  [/inventor|stock|store/i, 'inventory'],
  [/report/i, 'reports'],
];

/** Icon for a module by its name; a neutral grid for names that match nothing. */
function moduleIcon(label: string): IconName {
  return MODULE_ICON.find(([re]) => re.test(label))?.[1] ?? 'grid';
}

/** Items take one of six gradient hues in turn (Dashboard, the first item, keeps the brand emerald). */
const HUES = 6;

function Face({ entry }: { entry: Entry }) {
  return (
    <>
      <span className="e-rail-glow" aria-hidden="true" />
      <span className="e-rail-fill" aria-hidden="true" />
      <span className="e-rail-ico" aria-hidden="true"><Icon name={entry.icon ?? 'grid'} size={22} /></span>
      <span className="e-rail-text">{entry.label}</span>
    </>
  );
}

export function GradientRail() {
  const { groups, loading } = useNav();
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const entries = useMemo<Entry[]>(() => groups.flatMap((g, gi): Entry[] => {
    if (!g.collapsible) {
      return g.items.map((item, i) => ({ key: `i${gi}-${i}`, label: item.label, icon: item.icon, hue: 0, item }));
    }
    return [{ key: `m${gi}`, label: g.label ?? 'Menu', icon: moduleIcon(g.label ?? ''), hue: 0, group: g }];
  }).map((e, i) => ({ ...e, hue: i % HUES })), [groups]);

  const here = useMemo(() => findNavItem(groups, pathname, search), [groups, pathname, search]);

  // Close the fly-out when the page changes, on Escape, and on a press outside the rail.
  useEffect(() => { setOpen(null); }, [pathname, search]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(null); opener.current?.focus(); }
    };
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);
  useEffect(() => {
    if (open) flyRef.current?.querySelector<HTMLElement>('a')?.focus();
  }, [open]);

  const openEntry = entries.find((e) => e.key === open);

  return (
    <div ref={root} className="e-rail-root">
      <aside className="e-rail" aria-label="Main menu" style={{ '--rail-n': entries.length + 1 } as CSSProperties}>
        <span className="e-rail-logo" aria-hidden="true"><span>360</span></span>
        <nav aria-label="Main">
          <ul className="e-rail-list">
            {entries.map((entry) => {
              if (entry.item) {
                const { item } = entry;
                if (item.to) {
                  return (
                    <li key={entry.key}>
                      <NavLink to={item.to} end data-h={entry.hue} className={({ isActive }) => ['e-rail-item', isActive && 'e-rail-on'].filter(Boolean).join(' ')}>
                        <Face entry={entry} />
                      </NavLink>
                    </li>
                  );
                }
                return (
                  <li key={entry.key}>
                    <a href={item.legacyHref} data-h={entry.hue} className="e-rail-item" title="Opens the classic screen"><Face entry={entry} /></a>
                  </li>
                );
              }
              const on = !!here && !!entry.group?.items.includes(here);
              const isOpen = open === entry.key;
              return (
                <li key={entry.key}>
                  <button
                    type="button" data-h={entry.hue} className={['e-rail-item', (on || isOpen) && 'e-rail-on'].filter(Boolean).join(' ')}
                    aria-expanded={isOpen} aria-controls={isOpen ? 'e-rail-fly' : undefined} aria-current={on ? 'page' : undefined}
                    onClick={(e) => { opener.current = e.currentTarget; setOpen(isOpen ? null : entry.key); }}
                  >
                    <Face entry={entry} />
                  </button>
                </li>
              );
            })}
            {loading && (
              <li className="e-rail-loading" role="status">
                <span className="visually-hidden">Loading your menu</span>
                {[0, 1, 2].map((i) => <Skeleton key={i} w="100%" h={40} />)}
              </li>
            )}
          </ul>
        </nav>
      </aside>

      {openEntry?.group && (
        <div ref={flyRef} id="e-rail-fly" className="e-rail-fly" role="region" aria-label={`${openEntry.label} pages`}>
          <h2 className="e-rail-fly-title" data-h={openEntry.hue}>
            <span className="e-rail-fly-chip"><Icon name={openEntry.icon ?? 'grid'} size={18} /></span>
            <span>{openEntry.label}</span>
            <span className="e-rail-fly-count">{openEntry.group.items.length}</span>
          </h2>
          <ul>
            {openEntry.group.items.map((item, i, all) => (
              <li key={`${item.label}-${i}`}>
                {item.section && item.section !== all[i - 1]?.section && <div className="e-rail-fly-section">{item.section}</div>}
                {item.to ? (
                  <NavLink to={item.to} end className={({ isActive }) => ['e-rail-fly-link', isActive && 'e-rail-fly-on'].filter(Boolean).join(' ')}>
                    <span>{item.label}</span>
                    {item.isNew && <span className="e-rail-fly-new">New</span>}
                  </NavLink>
                ) : (
                  <a href={item.legacyHref} className="e-rail-fly-link" title="Opens the classic screen">
                    <span>{item.label}</span><Icon name="external" size={13} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
