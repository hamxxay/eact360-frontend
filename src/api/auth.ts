/* Sign-in through the legacy Login.aspx, with no backend change.
   Contract (read from E:\DigitalInvoice500\Login.aspx and Login.aspx.cs):
   - WebForms postback. Fields: inputUser, inputPassword, plus the page's hidden fields
     (__VIEWSTATE, __VIEWSTATEGENERATOR, __EVENTVALIDATION, ...). The clicked button is sent by name:
     ButtonSignIn ("Sign in") or ButtonForgetPassword ("Forget Password ?").
   - Success: Response.Redirect to the role's dashboard.
   - Failure: the page re-renders with <div class='alert alert-danger'>…</div>
     ("Invalid Username or Password…", "This Username already logged in…", "User Does not exist", …).
   - Forget password success: <div class='alert alert-success'>New password sent to …</div>.
   - A signed-in user who opens Login.aspx is redirected to Unauthorized.
   - Web.config sessionState cookieless="AutoDetect" may redirect the first GET to probe cookie support,
     so the GET follows redirects; the POST does not (its redirect may point to another host). */
import { useMocks } from './http';
import { sampleDelay } from '../mocks/delay';

export type Tone = 'ok' | 'bad';
export interface AuthMessage { tone: Tone; text: string }
export type SignInResult = { ok: true } | { ok: false; message: string; alreadySignedInElsewhere?: boolean };

const LOGIN = '/Login.aspx';

interface LoginForm { action: string; fields: [string, string][]; user: string; pass: string; signIn: [string, string]; forgot: [string, string] }

const text = (el: Element | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** Message from GetErrorMessage / GetSuccessMessage markup, without the close button and the "Error!/Congrats!" heading. */
function pageMessage(doc: Document): AuthMessage | null {
  const box = doc.querySelector('.alert-danger, .alert-success');
  if (!box) return null;
  box.querySelectorAll('button, h4').forEach((n) => n.remove());
  const t = text(box).replace(/\s+([,.!])/g, '$1'); // legacy copy has "Password , Please try again. "
  return t ? { tone: box.classList.contains('alert-success') ? 'ok' : 'bad', text: t } : null;
}

function readForm(doc: Document, pageUrl: string): LoginForm {
  const form = doc.querySelector('form');
  if (!form) throw new Error('The sign-in page could not be read.');
  const action = new URL(form.getAttribute('action') || LOGIN, pageUrl);
  const fields: [string, string][] = [];
  form.querySelectorAll<HTMLInputElement>('input[type=hidden]').forEach((i) => { if (i.name) fields.push([i.name, i.value]); });
  const nameOf = (id: string, fallback: string) => form.querySelector(`#${id}`)?.getAttribute('name') || fallback;
  const valueOf = (id: string, fallback: string) => form.querySelector(`#${id}`)?.getAttribute('value') || fallback;
  return {
    action: action.pathname + action.search,
    fields,
    user: nameOf('inputUser', 'inputUser'),
    pass: nameOf('inputPassword', 'inputPassword'),
    signIn: [nameOf('ButtonSignIn', 'ButtonSignIn'), valueOf('ButtonSignIn', 'Sign in')],
    forgot: [nameOf('ButtonForgetPassword', 'ButtonForgetPassword'), valueOf('ButtonForgetPassword', 'Forget Password ?')],
  };
}

/** True when the legacy session is signed in (the same check the context bridge uses). */
export async function isSignedIn(): Promise<boolean> {
  if (useMocks) return false;
  try {
    // Follows redirects (cookieless AutoDetect probe); a redirect to the login page or another origin = not signed in.
    const res = await fetch('/Error.aspx', { credentials: 'same-origin' });
    if (!res.ok || /\/login(portal)?(\.aspx)?$/i.test(new URL(res.url).pathname)) return false;
    const html = await res.text();
    return html.includes('sidebar-menu') || html.includes('glyphicon-user');
  } catch { return false; }
}

/** Loads Login.aspx. Returns 'signedIn' if the server says this browser already has a session. */
async function loadLoginForm(): Promise<LoginForm | 'signedIn'> {
  let res: Response;
  try {
    res = await fetch(LOGIN, { credentials: 'same-origin', headers: { Accept: 'text/html', 'X-Requested-With': 'XMLHttpRequest' } });
  } catch {
    // A redirect to another host (e.g. Unauthorized on the configured SiteURL) fails here.
    if (await isSignedIn()) return 'signedIn';
    throw new Error('Couldn’t reach the sign-in service. Check your connection and try again.');
  }
  if (/unauthorized/i.test(res.url)) return 'signedIn';
  if (!res.ok) throw new Error(`The sign-in service returned an error (${res.status}). Try again in a moment.`);
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
  return readForm(doc, res.url);
}

async function postBack(form: LoginForm, extra: [string, string][]) {
  const body = new URLSearchParams([...form.fields, ...extra]);
  return fetch(form.action, {
    method: 'POST',
    credentials: 'same-origin',
    redirect: 'manual',
    // X-Requested-With lets a future IIS rule (/Login.aspx → /app/login for page visits) skip these background calls.
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
    body,
  });
}

export async function signIn(userName: string, password: string): Promise<SignInResult> {
  if (useMocks) {
    await sampleDelay(null, 900);
    return password ? { ok: true } : { ok: false, message: 'Invalid Username or Password, Please try again.' };
  }
  const form = await loadLoginForm();
  if (form === 'signedIn') return { ok: true };

  const res = await postBack(form, [[form.user, userName], [form.pass, password], form.signIn]);

  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
    // Success redirects to the dashboard; an error page also redirects, so confirm the session.
    return (await isSignedIn())
      ? { ok: true }
      : { ok: false, message: 'Sign-in didn’t complete. Try again, or use the classic sign-in page.' };
  }
  if (!res.ok) return { ok: false, message: `The sign-in service returned an error (${res.status}). Try again in a moment.` };

  const msg = pageMessage(new DOMParser().parseFromString(await res.text(), 'text/html'));
  const message = msg?.text || 'Sign-in didn’t complete. Check your username and password.';
  return { ok: false, message, alreadySignedInElsewhere: /already logged in/i.test(message) };
}

/** Legacy "Forget Password ?": the server sends the account's sign-in details by SMS and email. */
export async function requestPassword(userName: string): Promise<AuthMessage> {
  if (useMocks) {
    await sampleDelay(null, 900);
    return { tone: 'ok', text: 'New password sent to your registered mobile and email Successfully!' };
  }
  const form = await loadLoginForm();
  if (form === 'signedIn') return { tone: 'ok', text: 'You’re already signed in.' };
  const res = await postBack(form, [[form.user, userName], [form.pass, ''], form.forgot]);
  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
    // Legacy redirects back to Login when the SMS or email could not be sent.
    return { tone: 'bad', text: 'We couldn’t send your details. Contact your administrator.' };
  }
  if (!res.ok) return { tone: 'bad', text: `The service returned an error (${res.status}). Try again in a moment.` };
  return pageMessage(new DOMParser().parseFromString(await res.text(), 'text/html'))
    ?? { tone: 'bad', text: 'We couldn’t confirm the request. Try again, or use the classic sign-in page.' };
}

/** Where to go after sign-in: a path inside the app only (no open redirects). */
export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) return '/';
  return value;
}
