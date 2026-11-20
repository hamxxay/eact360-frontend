/* Dates in the legacy formats.
   The session's DateFormats is several formats joined with "@" (App_Code/General/CommonMethod.cs):
     "dd/mm/yyyy@dd/MM/yyyy@DD/MM/YYYY" = bootstrap-datepicker @ jQuery dateFormat / .NET @ daterangepicker.
   Text sent to handlers is what the classic date boxes hold, written with the second (.NET-style) format. */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The .NET-style pattern from a session DateFormats value ("dd/MM/yyyy" when missing). */
export function legacyDateFormat(raw?: string): string {
  if (!raw) return 'dd/MM/yyyy';
  const parts = raw.split('@');
  return (parts.length > 1 ? parts[1] : parts[0])?.trim() || 'dd/MM/yyyy';
}

/** ISO "yyyy-mm-dd" → text in a .NET-style pattern (dd, d, MM, M, MMM, MMMM, yyyy, yy). */
export function toLegacyDate(iso: string, format: string): string {
  const [y, m, d] = iso.split('-');
  const mi = Number(m) - 1;
  return format.replace(/yyyy|yy|MMMM|MMM|MM|M|dd|d/g, (t) => ({
    yyyy: y!, yy: y!.slice(2), MMMM: MONTHS[mi]!, MMM: MONTHS[mi]!.slice(0, 3),
    MM: m!, M: String(Number(m)), dd: d!, d: String(Number(d)),
  })[t]!);
}

/** Text in a .NET-style pattern (as rendered in a classic date box) → ISO "yyyy-mm-dd"; "" if it doesn't parse. */
export function fromLegacyDate(text: string, format: string): string {
  const tokens: string[] = [];
  const re = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/yyyy|yy|MMMM|MMM|MM|M|dd|d/g, (t) => {
    tokens.push(t);
    return t.startsWith('MMM') ? '([A-Za-z]+)' : '(\\d{1,4})';
  });
  const m = new RegExp(`^${re}$`).exec(text.trim());
  if (!m) return '';
  let y = 0, mo = 0, d = 0;
  tokens.forEach((t, i) => {
    const v = m[i + 1]!;
    if (t === 'yyyy') y = Number(v);
    else if (t === 'yy') y = 2000 + Number(v);
    else if (t.startsWith('MMM')) mo = MONTHS.findIndex((n) => n.toLowerCase().startsWith(v.toLowerCase().slice(0, 3))) + 1;
    else if (t.startsWith('M')) mo = Number(v);
    else d = Number(v);
  });
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** A date from a handler (ISO "2026-11-19T00:00:00" from Json.NET, or "/Date(1763510400000)/") → ISO date. */
export function isoFromHandler(v: string | null | undefined): string {
  if (!v) return '';
  const ms = /\/Date\((-?\d+)/.exec(v);
  if (ms) {
    const dt = new Date(Number(ms[1]));
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  return v.slice(0, 10);
}
