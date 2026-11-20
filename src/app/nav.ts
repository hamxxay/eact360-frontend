import type { IconName } from '../components/Icon/Icon';
import { useLegacyContext } from '../legacy/contextBridge';
import { listMigrations } from '../lists';

/* Menu.
   - Sample mode: the static menu below.
   - Live mode: the user's own legacy menu (already filtered by role rights on the server), read by the
     context bridge.
   Every legacy link opens inside the new shell (/classic/<path>, Track 1). A link whose page has a native
   React replacement opens that route instead and is tagged "New" (Track 2). Removing an entry from MIGRATED
   switches that screen back to its classic page. */

export interface NavItem {
  label: string;
  icon?: IconName;
  to?: string;          // route inside the app (native screen or /classic/...)
  legacyHref?: string;  // only for links that can't open inside the app (another host)
  isNew?: boolean;      // native React screen
  section?: string;     // second-level heading inside a legacy group
  crumb?: string;       // group shown in the breadcrumb
}
export interface NavGroup { label?: string; items: NavItem[]; collapsible?: boolean }

/** Legacy page name (last path segment, without .aspx, lower case) → native React route. */
export const MIGRATED: Record<string, string> = {
  digitalinvoicelist: '/fbr/invoices',
  jvadjustments: '/accounts/jv/new',
  // Config-driven list screens (src/lists): JV adjustments list, charges, gratuity, leave encashment, ...
  ...listMigrations(),
};

/** Route that shows a classic page inside the shell; null if the link is on another host. */
export function classicRoute(href: string): string | null {
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  return `/classic${href}`;
}

export function migratedRoute(href: string): string | undefined {
  const seg = href.split(/[?#]/)[0]!.split('/').pop()?.toLowerCase().replace(/\.aspx$/, '') ?? '';
  return MIGRATED[seg];
}

/** Native route if migrated, else the classic route, else a plain link. */
function linkFor(label: string, href: string, extra: Partial<NavItem> = {}): NavItem {
  const native = migratedRoute(href);
  if (native) return { label, to: native, isNew: true, ...extra };
  const classic = classicRoute(href);
  return classic ? { label, to: classic, ...extra } : { label, legacyHref: href, ...extra };
}

const DASHBOARD: NavItem = { label: 'Dashboard', icon: 'home', to: '/' };

const STATIC_NAV: NavGroup[] = [
  {
    items: [
      DASHBOARD,
      linkFor('Sales', '/SalesOrder/CustomerInvoiceList.aspx', { icon: 'sales' }),
      linkFor('Purchases', '/PurchaseOrders/PurchaseOrdersList.aspx', { icon: 'purchases' }),
    ],
  },
  {
    label: 'Accounts',
    items: [
      linkFor('Chart of accounts', '/COA/COAList.aspx', { icon: 'accounts', crumb: 'Accounts' }),
      { label: 'Journal vouchers', icon: 'reports', to: '/accounts/jv', crumb: 'Accounts', isNew: true },
      { label: 'New journal voucher', icon: 'plus', to: '/accounts/jv/new', crumb: 'Accounts', isNew: true },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'FBR digital invoices', icon: 'fbr', to: '/fbr/invoices', crumb: 'Compliance', isNew: true },
      linkFor('Provincial invoices', '/DigitalInvoiceProvince/DigitalInvoiceProvinceList.aspx', { icon: 'province', crumb: 'Compliance' }),
    ],
  },
  {
    label: 'People',
    items: [linkFor('Employees', '/Employee/EmployeeList.aspx', { icon: 'people', crumb: 'People' })],
  },
];

/** Legacy role dashboards are labelled "<User> DashBoard", "FBR DashBoard", "DashBoard"...
   Show them as classic dashboards so they don't read as duplicates of the new Dashboard. */
export function classicDashboardLabel(label: string, href: string, userName: string) {
  let base = (userName ? label.replace(userName, '') : label).replace(/dash\s*board/i, '').trim();
  if (!base) {
    const page = href.split(/[?#]/)[0]!.split('/').pop()?.replace(/\.aspx$/i, '') ?? '';
    base = page.replace(/dash\s*board.*$/i, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  }
  return base ? `${base} dashboard (classic)` : 'Classic dashboard';
}

export function useNav(): { groups: NavGroup[]; loading: boolean } {
  const ctx = useLegacyContext();
  if (ctx.isSample) return { groups: STATIC_NAV, loading: false };
  if (ctx.loading || !ctx.menu) return { groups: [{ items: [DASHBOARD] }], loading: true };

  const top: NavGroup = {
    items: [DASHBOARD, ...ctx.dashboards.map((d) => linkFor(classicDashboardLabel(d.label, d.href, ctx.userName), d.href, { icon: 'reports' }))],
  };
  const groups: NavGroup[] = ctx.menu.map((g) => ({
    label: g.label,
    collapsible: true,
    items: g.links.map((l) => linkFor(l.label, l.href, { section: l.section, crumb: g.label })),
  }));
  return { groups: [top, ...groups], loading: false };
}

/** True when the user's menu offers this route (always true in sample mode). */
export function useHasRoute(route: string): boolean {
  const { groups, loading } = useNav();
  return !loading && groups.some((g) => g.items.some((i) => i.to === route));
}

export function findNavItem(groups: NavGroup[], pathname: string, search = ''): NavItem | undefined {
  const here = pathname + search;
  let best: NavItem | undefined;
  for (const g of groups) {
    for (const i of g.items) {
      if (!i.to) continue;
      if (i.to === here) return i;
      const p = i.to.split('?')[0]!;
      if (p === pathname || (p !== '/' && !p.startsWith('/classic') && pathname.startsWith(p))) best ??= i;
    }
  }
  return best;
}

