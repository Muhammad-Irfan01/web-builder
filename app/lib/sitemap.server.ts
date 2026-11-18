/**
 * Sitemap Compiler — server-side only
 * Generates a valid XML sitemap for a published project.
 * Called on every Publish / Save to keep the sitemap fresh.
 */
import type { Product } from './api';

export interface SitemapOptions {
  projectId: string;
  customDomain?: string | null;
  products?: Product[];
}

/**
 * Derive the canonical base URL for a project.
 * - If it has a custom domain, use that.
 * - Otherwise, fall back to the public /pub/:projectId path.
 */
function getBaseUrl(opts: SitemapOptions): string {
  if (opts.customDomain) {
    return `https://${opts.customDomain}`;
  }
  const appBase =
    process.env.VITE_APP_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://orcayoui.wattlesol.com'
      : 'http://localhost:3030');
  return `${appBase}/pub/${opts.projectId}`;
}

/** Escape XML special characters in a URL */
function xmlEncode(url: string): string {
  return url
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;');
}

function urlEntry(loc: string, changefreq: string, priority: string): string {
  const now = new Date().toISOString().split('T')[0];
  return `  <url>\n    <loc>${xmlEncode(loc)}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

/**
 * Compile a complete XML sitemap string.
 * @param opts SitemapOptions
 * @returns Full XML string
 */
export function compileSitemap(opts: SitemapOptions): string {
  const base = getBaseUrl(opts);
  const entries: string[] = [];

  // Homepage
  entries.push(urlEntry(`${base}/`, 'weekly', '1.0'));

  // Product catalogue
  entries.push(urlEntry(`${base}/products`, 'daily', '0.9'));

  // Static pages
  entries.push(urlEntry(`${base}/about`, 'monthly', '0.5'));
  entries.push(urlEntry(`${base}/contact`, 'monthly', '0.5'));

  // Individual product pages
  if (opts.products) {
    for (const p of opts.products) {
      const slug = p.slug ?? p.id;
      entries.push(urlEntry(`${base}/product/${slug}`, 'weekly', '0.8'));
    }
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join('\n') +
    `\n</urlset>`
  );
}
