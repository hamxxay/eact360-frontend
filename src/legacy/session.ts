/* Session handling. Expired or missing sessions go to the new sign-in screen (/app/login),
   which signs in through the legacy Login.aspx. */

let redirecting = false;

/** Path inside the app (without the /app base) to come back to after sign-in. */
function currentAppPath() {
  const p = window.location.pathname.replace(/^\/app/, '') || '/';
  return p.startsWith('/login') ? '/' : p + window.location.search;
}

export function redirectToLogin() {
  if (redirecting) return;
  redirecting = true;
  window.location.assign(`/app/login?returnTo=${encodeURIComponent(currentAppPath())}`);
}

/* Form drafts survive a session timeout: saved per form key, restored after the user signs in again.
   Browser storage can be unavailable (private windows, blocked site data), so every access is guarded. */
const DRAFT_PREFIX = 'eact:draft:';

export function saveDraft<T>(formKey: string, value: T) {
  try { localStorage.setItem(DRAFT_PREFIX + formKey, JSON.stringify({ savedAt: Date.now(), value })); } catch { /* ignore */ }
}

export function loadDraft<T>(formKey: string): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + formKey);
    return raw ? (JSON.parse(raw).value as T) : null;
  } catch { return null; }
}

export function clearDraft(formKey: string) {
  try { localStorage.removeItem(DRAFT_PREFIX + formKey); } catch { /* ignore */ }
}
