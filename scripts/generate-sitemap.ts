/**
 * Writes public/sitemap.xml before production builds.
 * Uses VITE_SITE_URL or SITE_URL when set (Vercel env).
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'sitemap.xml');

const SITE_URL = (
  process.env.VITE_SITE_URL ??
  process.env.SITE_URL ??
  process.env.FRONTEND_URL ??
  'https://www.youandmeafrica.com'
).replace(/\/$/, '');

const PATHS: { loc: string; changefreq: string; priority: string }[] = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/tickets', changefreq: 'weekly', priority: '0.9' },
  { loc: '/harvest-table', changefreq: 'monthly', priority: '0.7' },
  { loc: '/after-party-lunch', changefreq: 'monthly', priority: '0.7' },
];

const lastmod = new Date().toISOString().slice(0, 10);

const urls = PATHS.map(
  ({ loc, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${loc === '/' ? '/' : loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(OUT, xml, 'utf8');
console.log(`Wrote ${OUT} (${SITE_URL}, lastmod ${lastmod})`);
