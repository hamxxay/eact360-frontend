import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { isSignedIn } from '../../api/auth';
import { migratedRoute } from '../../app/nav';
import { applySkin } from '../../classic/skin';
import { Icon } from '../../components/Icon/Icon';
import { PageSkeleton, TableSkeleton } from '../../components/Loaders/Skeleton';
import { redirectToLogin } from '../../legacy/session';

/* Shows any classic WebForms page inside the new shell: /app/classic/<legacy path> → /<legacy path>.
   Same origin, so the page runs exactly as before (its own scripts, postbacks, handlers, session) and the
   Executive Slate skin is injected into it. Nothing in the backend changes. */

const isLoginPath = (p: string) => /\/login(\.aspx)?$/i.test(p) || /\/loginportal\.aspx$/i.test(p);

function readTitle(doc: Document) {
  const el = doc.querySelector('.content-header h1, .bootstrap-admin-box-title, .box-title, .panel-heading strong, h1, h2');
  return (el?.textContent ?? doc.title ?? '').replace(/\s+/g, ' ').trim();
}

export function ClassicPage() {
  const { '*': splat = '' } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const target = `/${splat}${search}`;

  const frame = useRef<HTMLIFrameElement>(null);
  const showing = useRef<string | null>(null);
  const targetRef = useRef(target);
  targetRef.current = target;
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [foreign, setForeign] = useState(false);

  // Point the frame at the URL's page, unless it is already showing it (in-frame navigation updates the URL too).
  useEffect(() => {
    if (!frame.current || showing.current === target) return;
    setLoading(true);
    setForeign(false);
    showing.current = target;
    frame.current.src = target;
  }, [target]);

  useEffect(() => { document.title = title ? `${title} · E-ACT 360` : 'E-ACT 360'; }, [title]);

  /** Runs when a classic document is shown: after a load, or when Back/Forward restores it from the page cache. */
  function onShown() {
    const f = frame.current;
    if (!f) return;
    let win: Window | null = null;
    let doc: Document | null = null;
    try {
      win = f.contentWindow;
      doc = f.contentDocument;
      if (!win || !doc || win.location.href === 'about:blank') return;
    } catch {
      // Another origin: either the classic login after a session end (SiteURL on another host), or a link
      // to a sub-domain. Check the session to tell them apart.
      isSignedIn().then((yes) => {
        if (!yes) { redirectToLogin(); return; }
        setForeign(true);
        setLoading(false);
      });
      return;
    }

    const path = win.location.pathname + win.location.search;
    if (isLoginPath(win.location.pathname)) { redirectToLogin(); return; } // classic session ended
    // This page has a new screen, unless the user asked for the classic one (?eactClassic=1; the legacy page
    // ignores the extra query value).
    const replacement = migratedRoute(win.location.pathname);
    // The query goes along (e.g. ?action=add&code=JV-12 for the list's success message).
    if (replacement && !/[?&]eactClassic=1\b/.test(win.location.search)) { navigate(replacement + win.location.search, { replace: true }); return; }

    try { applySkin(doc); } catch (e) { console.warn('E-ACT classic skin not applied:', e); } // never leave the page hidden
    setTitle(readTitle(doc));
    if (!(win as Window & { __eactHooked?: boolean }).__eactHooked) {
      (win as Window & { __eactHooked?: boolean }).__eactHooked = true;
      win.addEventListener('pagehide', () => setLoading(true));
      // A page restored by Back/Forward from the page cache fires pageshow but no load event.
      win.addEventListener('pageshow', (e) => { if (e.persisted) onShownRef.current(); });
    }

    showing.current = path;
    if (path !== targetRef.current) navigate(`/classic${path}`, { replace: true });
    setLoading(false);
  }
  const onShownRef = useRef(onShown);
  onShownRef.current = onShown;

  return (
    <div className={'e-classic-wrap'}>
      <div className={'e-classic-strip'}>
        <span className={'e-classic-tag'}>Classic screen</span>
        <span className={'e-classic-title'}>{title}</span>
        <a className={'e-classic-out'} href={target} title="Open this screen on its own, in the classic design">
          Open in classic view <Icon name="external" size={13} />
        </a>
      </div>
      <div className={'e-classic-stage'}>
        <iframe ref={frame} className={['e-classic-frame', loading && 'e-classic-frame-hidden'].filter(Boolean).join(' ')} title={title || 'Classic screen'} onLoad={() => onShownRef.current()} />
        {loading && (
          <div className={'e-classic-overlay'}>
            <PageSkeleton label="Opening screen" />
            <div className={'e-classic-overlay-table'}><TableSkeleton rows={6} cols={6} label="Opening screen" /></div>
          </div>
        )}
        {foreign && (
          <div className={'e-classic-overlay'}>
            <div className={'e-classic-foreign'}>
              <p>This screen is served from another address, so it can’t open inside the new design.</p>
              <a href={target} target="_blank" rel="noopener noreferrer">Open it in a new tab <Icon name="external" size={13} /></a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
