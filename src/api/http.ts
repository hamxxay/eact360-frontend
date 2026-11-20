/* Calls to the legacy .ashx handlers.
   Contract (read from assets/js, e.g. FBRIntegration/DigitalInvoiceList.js):
   POST /AjaxHandlers/<Module>/<Handler>.ashx?action=<Action>, form-encoded body, JSON response,
   authenticated by the same-origin ASP.NET session cookie. */
import { redirectToLogin } from '../legacy/session';

export class SessionExpiredError extends Error {
  constructor() { super('Your session has ended. Sign in again to continue.'); }
}

export class HandlerError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

type Params = Record<string, string | number | boolean | null | undefined>;

/** `inQuery`: send the values in the query string instead of the form body, exactly as classic pages that build
    "...ashx?action=X&BranchId=..&StartDate=.." URLs do (for handlers that read Request.QueryString directly). */
export async function postHandler<T>(handlerPath: string, action: string, params: Params = {}, opts: { inQuery?: boolean } = {}): Promise<T> {
  const body = new URLSearchParams();
  const query = new URLSearchParams({ action });
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (opts.inQuery) query.append(k, String(v)); else body.append(k, String(v));
  }

  const url = `/AjaxHandlers/${handlerPath}.ashx?${query.toString()}`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
    body,
  });

  // An expired session shows up as 401, as a redirect (to Login / Unauthorized, possibly on another host,
  // so redirects are not followed), or as an HTML page instead of JSON.
  if (isSessionEnded(res)) {
    redirectToLogin();
    throw new SessionExpiredError();
  }
  if (!res.ok) throw new HandlerError(`The server returned ${res.status} for ${action}.`, res.status);

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function isSessionEnded(res: Response) {
  if (res.type === 'opaqueredirect' || res.status === 401 || (res.status >= 300 && res.status < 400)) return true;
  const type = res.headers.get('content-type') ?? '';
  return res.ok && type.includes('text/html') && !res.url.toLowerCase().includes('.aspx');
}

/** Sample data stays on until each handler mapping is verified against its legacy page (phase D). */
export const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false';
