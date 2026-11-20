/* Company, user, financial period and the user's menu, read from the legacy session. Read-only; no backend change.

   Source: GET /Error.aspx. It is the lightest page built on BasePage, and it renders exactly what every
   legacy page renders (App_Code/GUI/BasePage.cs, App_Code/Markup/CommonMarkup.cs):
   - <head> inline scripts: var baseURL, DateFormats, CompanyDecimalPlaces, CurrencySymbol,
     PeriodStartDate, PeriodEndsDate, UserRoleId, ... (BasePage, "Scripts for Session Value")
   - header: <i class='glyphicon glyphicon-home'></i> <span class='hidden-xs'>{CompanyName}</span>
             <i class='glyphicon glyphicon-user'></i> <span class='hidden-xs'>{UserName}</span>
   - side menu: aside.main-sidebar ul.sidebar-menu, built from the user's role rights (GetSideMenu)
   With no session, BasePage redirects to the login page; that is treated as "session ended".
   DOMParser never runs the page's scripts. */
import { useQuery } from '@tanstack/react-query';
import { SessionExpiredError, useMocks } from '../api/http';
import { redirectToLogin } from './session';
import { legacyDateFormat } from '../lib/legacyDate';

export interface LegacyLink { label: string; href: string; section?: string }
export interface LegacyMenuGroup { label: string; links: LegacyLink[] }

export interface LegacyContext {
  companyName: string;
  userName: string;
  period: string;            // e.g. "FY 2026-27"
  roleId: number | null;
  currencySymbol: string;
  decimalPlaces: number;
  dateFormat: string;
  dashboards: LegacyLink[];  // role dashboards (CEO, FBR, partner...) from the top of the legacy menu
  menu: LegacyMenuGroup[] | null; // null = sample mode, use the static menu
  isSample: boolean;
}

const SAMPLE: LegacyContext = {
  companyName: 'Saffron Textiles (Pvt) Ltd',
  userName: 'Adil Rehman',
  period: 'FY 2026-27',
  roleId: null,
  currencySymbol: 'PKR',
  decimalPlaces: 0,
  dateFormat: 'dd/MM/yyyy',
  dashboards: [],
  menu: null,
  isSample: true,
};

const SOURCE = '/Error.aspx';

const text = (el: Element | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** Same-origin links become paths, so they work through the dev proxy and on any host name. */
function normalizeHref(href: string | null): string | null {
  if (!href || href === '#' || href.startsWith('javascript:')) return null;
  try {
    const u = new URL(href, window.location.origin);
    return u.origin === window.location.origin || /^localhost$|^127\./.test(u.hostname) ? u.pathname + u.search : u.href;
  } catch { return null; }
}

/** Inline `var Name = '...'` values a legacy page renders (BasePage session values and page-specific flags). */
export function scriptVars(doc: Document) {
  const vars: Record<string, string> = {};
  doc.querySelectorAll('script:not([src])').forEach((s) => {
    for (const m of (s.textContent ?? '').matchAll(/var\s+(\w+)\s*=\s*'([^']*)'/g)) vars[m[1]!] = m[2]!;
  });
  return vars;
}

/** "7/1/2026 12:00:00 AM" + "6/30/2027 ..." → "FY 2026-27". Any format with a 4-digit year works. */
function financialPeriod(start?: string, end?: string) {
  const y1 = start?.match(/\b(19|20)\d{2}\b/)?.[0];
  const y2 = end?.match(/\b(19|20)\d{2}\b/)?.[0];
  if (!y1) return '';
  return y2 && y2 !== y1 ? `FY ${y1}-${y2.slice(2)}` : `FY ${y1}`;
}

function parseMenu(root: Element | null) {
  const groups: LegacyMenuGroup[] = [];
  const dashboards: LegacyLink[] = [];
  if (!root) return { groups, dashboards };

  for (const li of Array.from(root.children)) {
    const sub = li.querySelector(':scope > ul.treeview-menu');
    if (!sub) {
      // Top-level dashboard entries (GetDefaultDashBoardHTML, GetCEODashBoardHTML, ...)
      const a = li.querySelector(':scope > a');
      const href = normalizeHref(a?.getAttribute('href') ?? null);
      const label = text(a?.querySelector('span')) || text(a);
      if (href && label) dashboards.push({ label, href });
      continue;
    }
    const label = text(li.querySelector(':scope > a > span')) || text(li.querySelector(':scope > a'));
    const links: LegacyLink[] = [];
    for (const item of Array.from(sub.children)) {
      const nested = item.querySelector(':scope > ul.treeview-menu');
      if (nested) {
        const section = text(item.querySelector(':scope > a'));
        nested.querySelectorAll(':scope > li > a').forEach((a) => {
          const href = normalizeHref(a.getAttribute('href'));
          if (href) links.push({ label: text(a), href, section });
        });
      } else {
        const a = item.querySelector(':scope > a');
        const href = normalizeHref(a?.getAttribute('href') ?? null);
        if (href) links.push({ label: text(a), href });
      }
    }
    if (label && links.length) groups.push({ label, links });
  }
  return { groups, dashboards };
}

export function parseLegacyPage(html: string): LegacyContext {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const v = scriptVars(doc);
  const { groups, dashboards } = parseMenu(doc.querySelector('aside.main-sidebar ul.sidebar-menu'));
  const nearSpan = (icon: string) => text(doc.querySelector(`.${icon}`)?.parentElement?.querySelector('.hidden-xs'));

  return {
    companyName: nearSpan('glyphicon-home'),
    userName: nearSpan('glyphicon-user') || text(doc.querySelector('.user-panel .info p')),
    period: financialPeriod(v.PeriodStartDate, v.PeriodEndsDate),
    roleId: v.UserRoleId ? Number(v.UserRoleId) : null,
    currencySymbol: v.CurrencySymbol || 'PKR',
    decimalPlaces: Number(v.CompanyDecimalPlaces) || 0,
    dateFormat: legacyDateFormat(v.DateFormats),
    dashboards,
    menu: groups,
    isSample: false,
  };
}

async function fetchContext(): Promise<LegacyContext> {
  if (useMocks) return SAMPLE;
  // Redirects are followed: Web.config sessionState cookieless="AutoDetect" redirects a first request to
  // ?AspxAutoDetectCookieSupport=1 even when signed in. Where the redirects end decides: the login page means
  // the session ended. A redirect to another origin can't be followed (TypeError) and is treated the same way.
  let res: Response;
  try {
    res = await fetch(SOURCE, { credentials: 'same-origin', headers: { Accept: 'text/html' } });
  } catch {
    redirectToLogin();
    throw new SessionExpiredError();
  }
  if (res.status === 401 || /\/(login|loginportal)(\.aspx)?(\?|$)/i.test(new URL(res.url).pathname + new URL(res.url).search)) {
    redirectToLogin();
    throw new SessionExpiredError();
  }
  if (!res.ok) throw new Error(`Couldn’t read your company and menu (the server returned ${res.status}).`);
  const ctx = parseLegacyPage(await res.text());
  if (!ctx.userName && !ctx.menu?.length) {
    // The page answered but has no header or menu: most likely the login page served without a redirect.
    redirectToLogin();
    throw new SessionExpiredError();
  }
  return ctx;
}

/** Loaded once per page load; never polled, so it does not keep an idle session alive. */
export function useLegacyContextQuery() {
  return useQuery({ queryKey: ['legacy', 'context'], queryFn: fetchContext, staleTime: Infinity, gcTime: Infinity });
}

/** The context, or the sample context while loading / in sample mode. */
export function useLegacyContext(): LegacyContext & { loading: boolean } {
  const q = useLegacyContextQuery();
  if (q.data) return { ...q.data, loading: false };
  return { ...SAMPLE, companyName: '', userName: '', period: '', isSample: useMocks, loading: !useMocks };
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '·';
}
