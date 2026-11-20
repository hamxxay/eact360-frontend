import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { findNavItem, useNav, type NavItem } from '../../app/nav';
import { useMocks } from '../../api/http';
import { initials, useLegacyContext } from '../../legacy/contextBridge';
import { Icon } from '../Icon/Icon';
import { Spinner } from '../Loaders/Spinner';
import { COLOR_SCHEMES, getColorScheme, getThemePreference, resolvedTheme, setColorScheme, setThemePreference, type ColorScheme, type ThemePreference } from '../../theme';

/** Colour scheme picker: five engraving inks (src/theme.ts). A menu of radio items; Esc or a click outside closes it. */
function SchemePicker() {
  const [scheme, setScheme] = useState<ColorScheme>(getColorScheme);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    box.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  const current = COLOR_SCHEMES.find((s) => s.id === scheme) ?? COLOR_SCHEMES[0]!;
  function pick(id: ColorScheme) { setScheme(id); setColorScheme(id); setOpen(false); btn.current?.focus(); }
  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    const items = [...(box.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(at + 1) % items.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(at - 1 + items.length) % items.length]?.focus(); }
  }
  return (
    <div className="e-scheme" ref={box}>
      <button ref={btn} type="button" className="e-topbar-theme" aria-haspopup="menu" aria-expanded={open}
        aria-label={`Colour scheme: ${current.label}`} title={`Colour scheme: ${current.label}`} onClick={() => setOpen((o) => !o)}>
        <span className="e-scheme-dot" style={{ '--sw': current.swatch } as CSSProperties} aria-hidden="true" />
      </button>
      {open && (
        <div className="e-scheme-menu" role="menu" aria-label="Colour scheme" onKeyDown={onMenuKey}>
          {COLOR_SCHEMES.map((s) => (
            <button key={s.id} type="button" role="menuitemradio" aria-checked={s.id === scheme} onClick={() => pick(s.id)}>
              <span className="e-scheme-dot" style={{ '--sw': s.swatch } as CSSProperties} aria-hidden="true" />
              {s.label}
              {s.id === scheme && <Icon name="ok" size={14} className="e-scheme-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Full screen for the whole app (shell + classic frames). Hidden where the browser has no Fullscreen API
   (e.g. iPhone Safari). Esc or the browser's own controls also leave full screen; the icon follows. */
function FullscreenButton() {
  const supported = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen && document.fullscreenEnabled !== false;
  const [on, setOn] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  if (!supported) return null;
  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch { /* refused by the browser (e.g. not from a user gesture): nothing to do */ }
  }
  const label = on ? 'Exit full screen' : 'Full screen';
  return (
    <button type="button" className="e-topbar-theme e-topbar-fs" onClick={() => void toggle()} aria-label={label} aria-pressed={on} title={label}>
      <Icon name={on ? 'fullscreenExit' : 'fullscreen'} size={16} />
    </button>
  );
}

export function TopBar() {
  const { pathname, search } = useLocation();
  const ctx = useLegacyContext();
  const { groups } = useNav();
  const item = findNavItem(groups, pathname, search);

  const [signingOut, setSigningOut] = useState(false);
  const [themePreference, setPreference] = useState<ThemePreference>(getThemePreference);

  function cycleTheme() {
    const preference = getThemePreference();
    const next: ThemePreference = preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
    setPreference(next);
    setThemePreference(next);
  }

  const currentTheme = resolvedTheme(themePreference);
  const ThemeIcon = currentTheme === 'dark' ? 'moon' : 'sun';
  const themeLabel = themePreference === 'system'
    ? `Theme: system (${currentTheme})`
    : `Theme: ${themePreference}`;
  /** Legacy Logout.aspx clears the session and writes the logout log; its redirect is not followed. */
  async function signOut() {
    setSigningOut(true);
    if (!useMocks) {
      try { await fetch('/Logout.aspx', { credentials: 'same-origin', redirect: 'manual' }); } catch { /* still leave */ }
    }
    window.location.assign('/app/login?signedOut=1');
  }

  return (
    <header className={'e-topbar-top'}>
      <nav aria-label="Breadcrumb" className={'e-topbar-crumb'}>
        {item?.crumb && <>{item.crumb} / </>}
        <b aria-current="page">{item?.label ?? 'E-ACT 360'}</b>
      </nav>
      <ScreenSearch />
      <FullscreenButton />
      <SchemePicker />
      <button type="button" className={'e-topbar-theme'} onClick={cycleTheme} aria-label={themeLabel} title={themeLabel}>
        <Icon name={ThemeIcon} size={16} />
      </button>
      <span className={'e-topbar-av'} title={ctx.userName} aria-label={ctx.userName ? `Signed in as ${ctx.userName}` : undefined}>
        {ctx.userName ? initials(ctx.userName) : ''}
      </span>
      <button type="button" className={'e-topbar-out'} onClick={signOut} disabled={signingOut} aria-busy={signingOut || undefined} aria-label={signingOut ? 'Signing out' : 'Sign out'} title="Sign out">
        {signingOut ? <Spinner size={14} /> : <Icon name="signOut" size={16} className={'e-topbar-out-icon'} />}
        <span className={'e-topbar-out-text'}>{signingOut ? 'Signing out…' : 'Sign out'}</span>
      </button>
    </header>
  );
}

interface Hit { item: NavItem; where: string; score: number }

/** Finds screens and forms in the user's own menu (only what their role allows). Ctrl+K focuses it. */
function ScreenSearch() {
  const { groups, loading } = useNav();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Every screen, with where it sits in the menu
  const index = useMemo(() => groups.flatMap((g) => g.items.map((item) => ({
    item, where: [g.label, item.section].filter(Boolean).join(' › '),
    text: `${item.label} ${item.section ?? ''} ${g.label ?? ''}`.toLowerCase(),
  }))), [groups]);

  const hits: Hit[] = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const phrase = words.join(' ');
    return index
      .filter((e) => words.every((w) => e.text.includes(w)))
      .map((e) => {
        const label = e.item.label.toLowerCase();
        const score = label.startsWith(phrase) ? 0 : label.split(/\s+/).some((w) => w.startsWith(words[0]!)) ? 1 : label.includes(phrase) ? 2 : 3;
        return { item: e.item, where: e.where, score };
      })
      .sort((a, b) => a.score - b.score || a.item.label.length - b.item.label.length)
      .slice(0, 30);
  }, [q, index]);

  useEffect(() => { setActive(0); }, [q]);

  // Ctrl+K / Cmd+K from anywhere
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus(); input.current?.select(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function go(hit: Hit | undefined) {
    if (!hit) return;
    setOpen(false);
    setQ('');
    input.current?.blur();
    if (hit.item.to) navigate(hit.item.to);
    else if (hit.item.legacyHref) window.location.assign(hit.item.legacyHref);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(hits[active]); }
    else if (e.key === 'Escape') { setOpen(false); setQ(''); }
  }

  const showList = open && q.trim().length > 0;
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    if (!showList || !box.current) return;
    const place = () => { const r = box.current!.getBoundingClientRect(); setPos({ top: r.bottom + 6, left: r.left, width: r.width }); };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [showList]);
  const optionId = (i: number) => `${listId}-o${i}`;
  // Keyboard moves keep the highlighted result in view; a press on the list (scrollbar drag) keeps it open.
  useEffect(() => { if (showList) document.getElementById(`${listId}-o${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active, showList, listId]);
  const pressing = useRef(false);
  useEffect(() => {
    const up = () => { pressing.current = false; };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  return (
    <div ref={box} className={'e-topbar-search'} role="search">
      <Icon name="search" size={16} />
      <label htmlFor={`${listId}-in`} className="visually-hidden">Search screens and forms</label>
      <input
        ref={input} id={`${listId}-in`} type="search" autoComplete="off" spellCheck={false}
        placeholder={loading ? 'Loading your menu…' : 'Search screens and forms…'}
        role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={showList && hits[active] ? optionId(active) : undefined}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => { if (!pressing.current) setOpen(false); }, 120)}
        onKeyDown={onKey}
      />
      <kbd className={'e-topbar-kbd'} aria-hidden="true">Ctrl K</kbd>
      {/* Results render at page level (portal, fixed under the field) so no page content or classic frame can paint
          over them; pressing on the list keeps focus in the field, so the scrollbar can be dragged without closing it. */}
      {showList && pos && createPortal(
        <ul id={listId} role="listbox" aria-label="Matching screens" className={'e-topbar-results'}
          style={{ '--top': `${pos.top}px`, '--left': `${pos.left}px`, '--w': `${pos.width}px` } as CSSProperties}
          onPointerDown={() => { pressing.current = true; }}
          onWheel={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}>
          {hits.length ? hits.map((h, i) => (
            <li
              key={`${h.item.label}-${h.item.to ?? h.item.legacyHref}`} id={optionId(i)} role="option" aria-selected={i === active}
              className={i === active ? 'e-topbar-hit e-topbar-hit-on' : 'e-topbar-hit'}
              onMouseDown={(e) => { e.preventDefault(); go(h); }} onMouseEnter={() => setActive(i)}
            >
              <span className={'e-topbar-hit-label'}>{h.item.label}</span>
              {h.where && <span className={'e-topbar-hit-where'}>{h.where}</span>}
              {h.item.isNew && <span className={'e-topbar-hit-new'}>New</span>}
            </li>
          )) : (
            <li className={'e-topbar-none'} role="option" aria-selected={false} aria-disabled="true">No screen matches “{q.trim()}”</li>
          )}
        </ul>,
        document.body,
      )}
    </div>
  );
}
