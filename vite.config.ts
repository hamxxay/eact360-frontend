import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

// The React app is served under /app on the same site as the legacy WebForms app,
// so the browser shares the legacy login session cookie.
// In development, every path outside /app is proxied to the running legacy site (default: IIS Express on 9575).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const legacy = env.LEGACY_URL || 'http://localhost:9575';
  const legacyOrigin = new URL(legacy).origin;

  /* Legacy pages write absolute URLs from SiteURL (redirects, links, `var baseURL` used by every AJAX call).
     In development SiteURL is the legacy port, a different origin from this dev server, so those URLs would
     leave the proxy (CORS errors, classic pages can't be skinned). Dev-only fix: strip the legacy origin from
     HTML/JS/JSON bodies and Location headers so everything stays on this origin.
     In production both apps share one public origin, so nothing is rewritten there. */
  const toLegacy: ProxyOptions = {
    target: legacy,
    changeOrigin: true, // IIS Express only answers to its own host:port
    secure: false,
    selfHandleResponse: true,
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => proxyReq.setHeader('accept-encoding', 'identity'));
      proxy.on('proxyRes', (proxyRes, _req, res) => {
        const headers = { ...proxyRes.headers };
        const loc = headers.location;
        if (typeof loc === 'string' && loc.toLowerCase().startsWith(legacyOrigin.toLowerCase())) {
          headers.location = loc.slice(legacyOrigin.length) || '/';
        }
        const type = String(headers['content-type'] ?? '');
        if (!/text\/html|javascript|json/i.test(type)) {
          res.writeHead(proxyRes.statusCode ?? 502, headers);
          proxyRes.pipe(res);
          return;
        }
        const chunks: Buffer[] = [];
        proxyRes.on('data', (c: Buffer) => chunks.push(c));
        proxyRes.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8').split(legacyOrigin).join('');
          delete headers['content-length'];
          res.writeHead(proxyRes.statusCode ?? 502, headers);
          res.end(body);
        });
      });
    },
  };

  return {
    base: '/app/',
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      // Everything outside /app belongs to the legacy site: handlers, .aspx pages, rewritten URLs
      // (EnableURLRewriting produces paths without .aspx), assets, uploads and SignalR.
      proxy: { '^/(?!app(/|$)).*': toLegacy },
    },
  };
});
