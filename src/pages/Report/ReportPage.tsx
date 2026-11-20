import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { applySkin } from '../../classic/skin';
import { redirectToLogin } from '../../legacy/session';

/* A legacy report page (HTML report viewer: JV, receipts, approvals...) shown on its own, without the shell:
   /app/report/<legacy path> → /<legacy path>. Same origin, so the report runs exactly as before (print, Excel
   export); the screen skin from src/styles/eact.css (section 9) is injected so it matches the app.
   Reports open in a new tab, so there is no menu or top bar here. */

const isLoginPath = (p: string) => /\/login(\.aspx)?$/i.test(p) || /\/loginportal\.aspx$/i.test(p);

export function ReportPage() {
  const { '*': splat = '' } = useParams();
  const { search } = useLocation();
  const target = `/${splat}${search}`;
  const frame = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'Report · E-ACT 360'; }, []);

  function onLoad() {
    const f = frame.current;
    try {
      const win = f?.contentWindow;
      const doc = f?.contentDocument;
      if (!win || !doc || win.location.href === 'about:blank') return;
      if (isLoginPath(win.location.pathname)) { redirectToLogin(); return; } // session ended
      try { applySkin(doc); } catch (e) { console.warn('E-ACT report skin not applied:', e); } // never leave the report hidden
      if (doc.title) document.title = doc.title;
    } catch { /* another origin: show it as it is */ }
    setLoading(false);
  }

  return (
    <iframe
      ref={frame} src={target} title="Report" onLoad={onLoad}
      className={['e-report-frame', loading && 'e-report-frame-hidden'].filter(Boolean).join(' ')}
    />
  );
}
