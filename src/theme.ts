export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'eact-theme';

export function systemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // Storage may be unavailable in a locked-down browser; system mode still works.
  }
  return 'system';
}

export function resolvedTheme(preference = getThemePreference()): 'light' | 'dark' {
  return preference === 'system' ? systemTheme() : preference;
}

function setDocumentTheme(doc: Document, theme: 'light' | 'dark') {
  doc.documentElement.dataset.eactTheme = theme;
  doc.documentElement.style.colorScheme = theme;
  const meta = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  meta?.setAttribute('content', theme === 'dark' ? '#0F172A' : '#F8FAFC');
}

export function applyTheme(preference: ThemePreference) {
  const theme = resolvedTheme(preference);
  setDocumentTheme(document, theme);

  document.querySelectorAll<HTMLIFrameElement>('iframe.e-classic-frame').forEach((frame) => {
    try {
      if (frame.contentDocument) setDocumentTheme(frame.contentDocument, theme);
    } catch {
      // Cross-origin frames cannot receive the shell theme.
    }
  });
  return theme;
}

export function setThemePreference(preference: ThemePreference) {
  try { localStorage.setItem(STORAGE_KEY, preference); } catch { /* use the in-memory document state */ }
  return applyTheme(preference);
}

export function initializeTheme() {
  applyColorScheme(getColorScheme());
  applyTheme(getThemePreference());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getThemePreference() === 'system') applyTheme('system');
  });
}

/* Colour schemes (user choice): five engraving inks for the accent, the side rail and its rule. Status colours
   (ok / wait / bad / void) never change. Stored per browser; applied as data-eact-scheme on the shell and on
   every classic frame (tokens in src/styles/eact.css, section 2 "Colour schemes"). */
export type ColorScheme = 'green' | 'navy' | 'oxblood' | 'graphite' | 'indigo';

export const COLOR_SCHEMES: { id: ColorScheme; label: string; swatch: string }[] = [
  { id: 'green', label: 'Pine emerald', swatch: '#0AA347' },
  { id: 'navy', label: 'Banker’s navy', swatch: '#1B2F5B' },
  { id: 'oxblood', label: 'Oxblood', swatch: '#6B1E2C' },
  { id: 'graphite', label: 'Graphite', swatch: '#2B2F36' },
  { id: 'indigo', label: 'Indigo', swatch: '#312E81' },
];

const SCHEME_KEY = 'eact-scheme';

export function getColorScheme(): ColorScheme {
  try {
    const saved = localStorage.getItem(SCHEME_KEY);
    if (COLOR_SCHEMES.some((s) => s.id === saved)) return saved as ColorScheme;
  } catch { /* storage unavailable: default scheme */ }
  return 'green';
}

function setDocumentScheme(doc: Document, scheme: ColorScheme) {
  doc.documentElement.dataset.eactScheme = scheme;
}

export function applyColorScheme(scheme: ColorScheme) {
  setDocumentScheme(document, scheme);
  document.querySelectorAll<HTMLIFrameElement>('iframe.e-classic-frame').forEach((frame) => {
    try { if (frame.contentDocument) setDocumentScheme(frame.contentDocument, scheme); } catch { /* cross-origin */ }
  });
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  meta?.setAttribute('content', COLOR_SCHEMES.find((s) => s.id === scheme)?.swatch ?? '#0AA347');
}

export function setColorScheme(scheme: ColorScheme) {
  try { localStorage.setItem(SCHEME_KEY, scheme); } catch { /* in-memory only */ }
  applyColorScheme(scheme);
}