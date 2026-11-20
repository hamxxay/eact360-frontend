import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isSignedIn, requestPassword, safeReturnTo, signIn, type AuthMessage } from '../../api/auth';
import { useMocks } from '../../api/http';
import { Button } from '../../components/Button/Button';
import { Icon } from '../../components/Icon/Icon';

const LEGACY = {
  login: '/Login.aspx',
  signUp: '/PortalSettings.aspx',
  signUpAgent: '/PortalSettingsForAgent.aspx',
  help: 'https://youtu.be/LBvLZPNdjCk', // the sign-up help video linked from the classic login page
};

type View = 'signIn' | 'forgot';
type Notice = { tone: AuthMessage['tone'] | 'info'; text: string };

export function LoginPage() {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get('returnTo'));
  const [view, setView] = useState<View>('signIn');

  // Legacy flows that must stay on the classic page: FBR agent auto sign-in by GUID.
  const handOff = params.get('FBRAgent') && params.get('GUID');
  useEffect(() => {
    if (handOff) window.location.replace(LEGACY.login + window.location.search);
  }, [handOff]);

  // Already signed in (e.g. another tab): go straight in.
  useEffect(() => {
    if (handOff) return;
    let live = true;
    isSignedIn().then((yes) => { if (yes && live) window.location.replace(`/app${returnTo}`); });
    return () => { live = false; };
  }, [handOff, returnTo]);

  useEffect(() => { document.title = 'Sign in · E-ACT 360'; }, []);

  const notice: Notice | null =
    params.get('FBR') ? { tone: 'ok', text: 'You’re registered with E-ACT 360. You’ll shortly receive your details by email or SMS.' }
      : params.get('signedOut') ? { tone: 'ok', text: 'You’ve signed out.' }
        : params.get('returnTo') && returnTo !== '/' ? { tone: 'info', text: 'Sign in to continue where you left off.' }
          : null;

  return (
    <div className={'e-login-page'}>
      <aside className={'e-login-brand-panel'}>
        <div className={'e-login-brand'}>
          <span className={'e-login-logo'} aria-hidden="true">360</span>
          E-ACT 360
        </div>
        <div className={'e-login-pitch'}>
          <h2>Your books, operations and FBR invoicing in one place.</h2>
          <ul>
            <li><Icon name="accounts" size={18} />Accounting, inventory, sales, purchasing and payroll</li>
            <li><Icon name="fbr" size={18} />FBR and provincial digital invoicing from the same records</li>
            <li><Icon name="people" size={18} />One sign-in for accountants, owners, FBR agents and partners</li>
          </ul>
        </div>
        <p className={'e-login-legal'}>E-ACT 360 · Business suite and digital invoicing for Pakistan</p>
      </aside>

      <main className={'e-login-form-side'}>
        <div className={'e-login-mobile-brand'} aria-hidden="true">
          <span className={'e-login-logo'}>360</span>E-ACT 360
        </div>
        <div className={'e-login-box'}>
          {handOff ? (
            <Opening text="Opening your FBR agent account…" />
          ) : view === 'signIn' ? (
            <SignInForm returnTo={returnTo} notice={notice} onForgot={() => setView('forgot')} />
          ) : (
            <ForgotForm onBack={() => setView('signIn')} />
          )}
        </div>
        <p className={'e-login-classic'}>
          Trouble signing in? <a href={LEGACY.login}>Use the classic sign-in page</a>
        </p>
      </main>
    </div>
  );
}

function Opening({ text }: { text: string }) {
  return (
    <div className={'e-login-opening'} role="status">
      <span className={'e-login-ring'} aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

function Message({ msg }: { msg: Notice }) {
  const { tone } = msg;
  return (
    <div className={`${'e-login-msg'} ${`e-login-${tone}`}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <Icon name={tone === 'bad' ? 'bad' : tone === 'ok' ? 'ok' : 'info'} size={18} />
      <span>{msg.text}</span>
    </div>
  );
}

function SignInForm({ returnTo, notice, onForgot }: { returnTo: string; notice: Notice | null; onForgot: () => void }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<{ text: string; elsewhere?: boolean } | null>(null);
  const [touched, setTouched] = useState({ user: false, pass: false });
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => { userRef.current?.focus(); }, []);

  const userMissing = touched.user && !user.trim();
  const passMissing = touched.pass && !pass;

  function onKey(e: KeyboardEvent<HTMLInputElement>) { setCaps(e.getModifierState?.('CapsLock') ?? false); }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched({ user: true, pass: true });
    if (!user.trim()) { userRef.current?.focus(); return; }
    if (!pass) { passRef.current?.focus(); return; }
    setBusy(true);
    setError(null);
    try {
      const r = await signIn(user.trim(), pass);
      if (r.ok) {
        setDone(true);
        window.location.assign(`/app${returnTo}`);
        return;
      }
      setError({ text: r.message, elsewhere: r.alreadySignedInElsewhere });
      setPass('');
      setTouched((t) => ({ ...t, pass: false })); // the server message already explains; no second "enter your password"
      passRef.current?.focus();
    } catch (err) {
      setError({ text: err instanceof Error ? err.message : 'Something went wrong. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  if (done) return <Opening text="Signed in. Opening E-ACT 360…" />;

  return (
    <form onSubmit={submit} noValidate aria-describedby={error ? 'login-error' : undefined}>
      <h1 className={'e-login-h1'}>Sign in</h1>
      <p className={'e-login-lead'}>Use your E-ACT 360 username and password.</p>

      {useMocks && <Message msg={{ tone: 'info', text: 'Sample mode: any username with any password signs in.' }} />}
      {notice && !error && <Message msg={notice} />}
      {error && (
        <div id="login-error">
          <Message msg={{ tone: 'bad', text: error.text }} />
          {error.elsewhere && (
            <p className={'e-login-hint'}>Sign out on the other device or browser first. If you can’t, ask your administrator to end that session.</p>
          )}
        </div>
      )}

      <div className={'e-login-field'}>
        <label htmlFor="login-user">Username</label>
        <input
          ref={userRef} id="login-user" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false}
          value={user} onChange={(e) => setUser(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, user: true }))}
          aria-invalid={userMissing || undefined} aria-describedby={userMissing ? 'user-err' : undefined} disabled={busy}
        />
        {userMissing && <span id="user-err" className={'e-login-field-err'}>Enter your username.</span>}
      </div>

      <div className={'e-login-field'}>
        <div className={'e-login-label-row'}>
          <label htmlFor="login-pass">Password</label>
          <button type="button" className={'e-login-link-btn'} onClick={onForgot}>Forgot password?</button>
        </div>
        <div className={'e-login-pass-wrap'}>
          <input
            ref={passRef} id="login-pass" name="password" type={show ? 'text' : 'password'} autoComplete="current-password"
            value={pass} onChange={(e) => setPass(e.target.value)} onKeyUp={onKey} onKeyDown={onKey}
            onBlur={() => { setTouched((t) => ({ ...t, pass: true })); setCaps(false); }}
            aria-invalid={passMissing || undefined} aria-describedby={[passMissing && 'pass-err', caps && 'caps'].filter(Boolean).join(' ') || undefined}
            disabled={busy}
          />
          <button type="button" className={'e-login-reveal'} onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        {passMissing && <span id="pass-err" className={'e-login-field-err'}>Enter your password.</span>}
        {caps && <span id="caps" className={'e-login-caps'}>Caps Lock is on.</span>}
      </div>

      <Button type="submit" variant="primary" block loading={busy} loadingText="Signing in…">Sign in</Button>

      <div className={'e-login-signup'}>
        <span>New to E-ACT 360?</span>
        <div className={'e-login-signup-links'}>
          <a href={LEGACY.signUp}>Sign up your company</a>
          <a href={LEGACY.signUpAgent}>Sign up as an FBR agent</a>
        </div>
        <a className={'e-login-help'} href={LEGACY.help} target="_blank" rel="noopener noreferrer">
          Watch the sign-up help video <Icon name="external" size={13} />
        </a>
      </div>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [user, setUser] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<AuthMessage | null>(null);
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user.trim()) { setMissing(true); ref.current?.focus(); return; }
    setBusy(true);
    setMsg(null);
    try { setMsg(await requestPassword(user.trim())); }
    catch (err) { setMsg({ tone: 'bad', text: err instanceof Error ? err.message : 'Something went wrong. Try again.' }); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} noValidate>
      <button type="button" className={'e-login-back'} onClick={onBack}>← Back to sign in</button>
      <h1 className={'e-login-h1'}>Forgot your password?</h1>
      <p className={'e-login-lead'}>Enter your username. We’ll send your sign-in details to the mobile number and email on your account.</p>

      {msg && <Message msg={msg} />}

      <div className={'e-login-field'}>
        <label htmlFor="forgot-user">Username</label>
        <input
          ref={ref} id="forgot-user" autoComplete="username" autoCapitalize="none" spellCheck={false}
          value={user} onChange={(e) => { setUser(e.target.value); setMissing(false); }}
          aria-invalid={missing || undefined} aria-describedby={missing ? 'forgot-err' : undefined} disabled={busy}
        />
        {missing && <span id="forgot-err" className={'e-login-field-err'}>Enter your username.</span>}
      </div>

      <Button type="submit" variant="primary" block loading={busy} loadingText="Sending…">Send my details</Button>
    </form>
  );
}
