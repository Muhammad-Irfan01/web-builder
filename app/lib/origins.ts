/**
 * Where the Orcayo backend and merchant dashboard live, and which origins may embed / call the builder.
 *
 * Build-time (baked into the browser bundle by Vite):
 *   VITE_API_BASE_URL   backend gateway, with or without a trailing /api   (default http://localhost:3000)
 *   VITE_DASHBOARD_URL  merchant dashboard                                 (default http://localhost:3000)
 * Runtime (server only):
 *   ALLOWED_ORIGINS     extra comma-separated origins allowed by CORS and the referer check
 *   VITE_APP_URL        public URL of this builder                         (default http://localhost:3030)
 *   SITES_DOMAIN        base domain for system subdomains, <slug>.<SITES_DOMAIN> (default localhost)
 *   CNAME_TARGET        host that custom domains CNAME to                  (default: host of VITE_APP_URL)
 */

const DEFAULT_API_ORIGIN = 'http://localhost:3000';
const DEFAULT_DASHBOARD_URL = 'http://localhost:3000';

const viteEnv: Record<string, string | undefined> =
  (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const serverEnv = (name: string): string | undefined =>
  typeof process !== 'undefined' && process.env ? process.env[name] : undefined;

const isServer = typeof window === 'undefined';
/** On the server, runtime env wins (e.g. an internal Docker hostname); in the browser, the build-time value. */
const pick = (name: string) => (isServer ? serverEnv(name) || viteEnv[name] : viteEnv[name]);

const stripApi = (url: string) => url.replace(/\/+$/, '').replace(/\/api$/, '');

/** Backend origin without /api, e.g. https://api.example.com */
export const API_ORIGIN = stripApi(pick('VITE_API_BASE_URL') || DEFAULT_API_ORIGIN);

/** Merchant dashboard origin, e.g. https://app.example.com */
export const DASHBOARD_URL = (pick('VITE_DASHBOARD_URL') || DEFAULT_DASHBOARD_URL)
  .replace(/\/+$/, '');

/** Origins configured for this deployment (dashboard + ALLOWED_ORIGINS). */
export function configuredOrigins(): string[] {
  const extra = (serverEnv('ALLOWED_ORIGINS') || '').split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);
  return [DASHBOARD_URL, ...extra];
}

/** True for localhost and the configured dashboard / extra origins. */
export function isTrustedOrigin(urlStr: string | null | undefined): boolean {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    return configuredOrigins().some((o) => {
      try {
        return new URL(o).origin === parsed.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/** Public URL of this builder (server only), e.g. https://builder.example.com */
export function builderAppUrl(): string {
  return (serverEnv('VITE_APP_URL') || 'http://localhost:3030').replace(/\/+$/, '');
}

/** Hostname of this builder (server only), e.g. builder.example.com */
export function builderHost(): string {
  try {
    return new URL(builderAppUrl()).hostname.toLowerCase();
  } catch {
    return 'localhost';
  }
}

/** System hostname for a project slug, e.g. saloon.sites.example.com */
export function systemHostname(slug: string): string {
  return `${slug}.${(serverEnv('SITES_DOMAIN') || 'localhost').replace(/^\.+|\.+$/g, '')}`;
}

/** Host that custom (sub)domains must CNAME to. */
export function cnameTarget(): string {
  return (serverEnv('CNAME_TARGET') || builderHost()).replace(/\.+$/, '').toLowerCase();
}
