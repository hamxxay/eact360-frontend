import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { findNavItem, useNav, type NavItem } from '../../app/nav';
import { useLegacyContext } from '../../legacy/contextBridge';
import { Icon } from '../Icon/Icon';
import { Skeleton } from '../Loaders/Skeleton';

/** Two-letter badge for a menu group or an item without an icon, shown in the collapsed rail. */
function abbr(label: string) {
  const words = label.replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  const two = words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? '').slice(0, 2);
  return (two || '·').toUpperCase();
}

export function Sidebar({ open, onClose, collapsed, onCollapsedChange }: {
  open: boolean; onClose: () => void; collapsed: boolean; onCollapsedChange: (next: boolean) => void;
}) {
  const ctx = useLegacyContext();
  const { groups, loading } = useNav();
  const { pathname, search } = useLocation();
  // Open groups. Navigation only ever OPENS the group holding the current page; only the user's own clicks
  // close a group. (The old rule XOR-ed "opened by hand" with "holds the current page", so opening a form
  // from a group you had expanded snapped that group shut and the whole menu jumped.)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const nav = useRef<HTMLElement>(null);
  // Finding a screen is done by the search box in the top bar (it searches this same menu).
  const activeGroup = useMemo(() => {
    const item = findNavItem(groups, pathname, search);
    return groups.find((g) => g.collapsible && item && g.items.includes(item))?.label;
  }, [groups, pathname, search]);

  useEffect(() => {
    if (!activeGroup) return;
    setExpanded((s) => (s.has(activeGroup) ? s : new Set(s).add(activeGroup)));
  }, [activeGroup]);

  // Keep the current item in view without jumping the menu (only scrolls when it is off-screen).
  useEffect(() => {
    const id = requestAnimationFrame(() => nav.current?.querySelector('.e-sidebar-on')?.scrollIntoView({ block: 'nearest' }));
    return () => cancelAnimationFrame(id);
  }, [pathname, search, expanded]);

  function toggle(label: string) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }

  return (
    <aside className={['e-sidebar-side', open && 'e-sidebar-open', collapsed && 'e-sidebar-collapsed'].filter(Boolean).join(' ')} aria-label="Main menu">
      <div className={'e-sidebar-brand'}>
        <span className={'e-sidebar-logo'} aria-hidden="true">360</span>
        <span className="e-sidebar-label">E-ACT 360</span>
        <button
          type="button" className="e-sidebar-collapse" onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} aria-pressed={collapsed}
          title={collapsed ? 'Expand menu (Ctrl+B)' : 'Collapse menu (Ctrl+B)'}
        >
          <Icon name={collapsed ? 'expand' : 'collapse'} size={18} />
        </button>
        <button type="button" className={'e-sidebar-close'} onClick={onClose} aria-label="Close menu">
          <Icon name="close" />
        </button>
      </div>

      <nav ref={nav} className={'e-sidebar-nav'}>
        {groups.map((group, gi) => {
          if (!group.collapsible) {
            return (
              <div key={gi} role="group" aria-labelledby={group.label ? `nav-g${gi}` : undefined}>
                {group.label && <div id={`nav-g${gi}`} className={'e-sidebar-grp'}>{group.label}</div>}
                <ul>{group.items.map((item) => <li key={item.label + (item.to ?? item.legacyHref)}><Item item={item} collapsed={collapsed} /></li>)}</ul>
              </div>
            );
          }
          const isOpen = !collapsed && expanded.has(group.label!);
          const id = `nav-m${gi}`;
          return (
            <div key={group.label} className={'e-sidebar-module'}>
              <button
                type="button" className={['e-sidebar-mod-head', group.label === activeGroup && 'e-sidebar-mod-on'].filter(Boolean).join(' ')}
                aria-expanded={isOpen} aria-controls={id} title={collapsed ? group.label : undefined}
                onClick={() => {
                  if (!collapsed) { toggle(group.label!); return; }
                  // From the rail: open the full menu with this group expanded.
                  onCollapsedChange(false);
                  setExpanded((s) => new Set(s).add(group.label!));
                }}
              >
                <span className="e-sidebar-abbr" aria-hidden="true">{abbr(group.label!)}</span>
                <span className="e-sidebar-label">{group.label}</span>
                <span className={'e-sidebar-count'}>{group.items.length}</span>
                <span className={'e-sidebar-chev'} aria-hidden="true" />
              </button>
              {isOpen && (
                <ul id={id} className={'e-sidebar-mod-list'}>
                  {group.items.map((item, i) => (
                    <li key={`${item.label}-${i}`}>
                      {item.section && item.section !== group.items[i - 1]?.section && <div className={'e-sidebar-section'}>{item.section}</div>}
                      <Item item={item} sub />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {loading && (
          <div className={'e-sidebar-loading'} role="status">
            <span className="visually-hidden">Loading your menu</span>
            {[70, 55, 80, 60, 75, 50].map((w, i) => <Skeleton key={i} w={`${w}%`} h={12} />)}
          </div>
        )}
      </nav>

      <div className={'e-sidebar-org'}>
        {ctx.loading ? (
          <><Skeleton w="80%" h={13} /><Skeleton w="40%" h={10} className="e-ld-gap-8" /></>
        ) : (ctx.companyName || 'E-ACT 360')}
        {ctx.period && <span>{ctx.period}</span>}
        {ctx.isSample && <span className={'e-sidebar-sample'}>Sample company</span>}
      </div>
    </aside>
  );
}

function Item({ item, sub, collapsed }: { item: NavItem; sub?: boolean; collapsed?: boolean }) {
  const cls = ['e-sidebar-link', sub && 'e-sidebar-sub'].filter(Boolean).join(' ');
  const mark = item.icon ? <Icon name={item.icon} /> : !sub && <span className="e-sidebar-abbr" aria-hidden="true">{abbr(item.label)}</span>;
  if (item.to) {
    return (
      <NavLink to={item.to} end title={collapsed ? item.label : undefined} className={({ isActive }) => [cls, isActive && 'e-sidebar-on'].filter(Boolean).join(' ')}>
        {mark}<span className="e-sidebar-label">{item.label}</span>
        {item.isNew && sub && <span className={'e-sidebar-new-tag'}>New</span>}
      </NavLink>
    );
  }
  return (
    <a href={item.legacyHref} className={cls} title={collapsed ? item.label : 'Opens the classic screen'}>
      {mark}<span className="e-sidebar-label">{item.label}</span>
      <Icon name="external" size={13} className={'e-sidebar-ext'} />
    </a>
  );
}
