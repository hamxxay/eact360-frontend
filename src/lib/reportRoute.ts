/** Address that shows a legacy report page on its own (no shell), skinned: /app/report/<legacy path>.
   Reports open in a new tab (print / export); this keeps that, with the new look. Another host: unchanged. */
export function reportRoute(href: string): string {
  try {
    const u = new URL(href, window.location.origin);
    if (u.origin !== window.location.origin) return href;
    return `${import.meta.env.BASE_URL}report${u.pathname}${u.search}`;
  } catch { return href; }
}
