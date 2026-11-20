/* Stroke icons from the Category standard mocks, plus the few UI icons the app needs. */
const PATHS = {
  home: <path d="M3 12l9-8 9 8M5 10v10h14V10" />,
  sales: <path d="M4 4h16v16H4zM4 9h16" />,
  purchases: <path d="M6 6h15l-2 9H8L6 3H3" />,
  inventory: <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7" />,
  accounts: <path d="M4 19V5M10 19V9M16 19v-6M22 19H2" />,
  fbr: <path d="M7 3h8l4 4v14H7zM15 3v4h4M10 13l2 2 4-4" />,
  province: <path d="M7 3h10v18H7zM10 8h4M10 12h4" />,
  people: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  reports: <path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h3" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  fullscreen: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  fullscreenExit: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  collapse: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15.5 9.5L13 12l2.5 2.5" /></>,
  expand: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M13 9.5l2.5 2.5-2.5 2.5" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />,
  signOut: <path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3" />,
  more: <><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
  ok: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  bad: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v6M12 16.5v.01" /></>,
  wait: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3.5 2" /></>,
  info: <><path d="M6 9.5h9a4 4 0 010 8h-4" /><path d="M9.5 6L6 9.5 9.5 13" /></>,
  sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></>,
  moon: <path d="M20 15.5A8.5 8.5 0 018.5 4a8.5 8.5 0 1011.5 11.5z" />,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  building: <path d="M5 21V4h9v17M14 9h5v12M3 21h18M8 8h3M8 12h3M8 16h3" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></>,
  shield: <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6zM9 12l2 2 4-4" />,
  wallet: <path d="M4 7h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h11M16 14h2" />,
  folder: <path d="M3 6a1 1 0 011-1h5l2 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1z" />,
  grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
