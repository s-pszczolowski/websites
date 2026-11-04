import type { APIRoute } from 'astro';
import { CATEGORIES, SITE, INFO_PAGES } from '../config/site';
import { getArticles, articleUrl, categoryUrl, monthKey } from '../lib/articles';
import { ownerDataComplete } from '../lib/deployment';

export const GET: APIRoute = async ({ site }) => {
  const all = await getArticles();
  const abs = (p: string) => new URL(p, site).href;
  const newest = all[0].data.date.toISOString();
  const entries: { loc: string; lastmod?: string }[] = [{ loc: abs('/'), lastmod: newest }];
  for (const a of all) entries.push({ loc: abs(articleUrl(a)), lastmod: (a.data.updated ?? a.data.date).toISOString() });
  for (const c of CATEGORIES) {
    const list = all.filter((a) => a.data.category === c.slug);
    const pages = Math.ceil(list.length / SITE.perCategoryPage);
    for (let p = 1; p <= pages; p++) entries.push({ loc: abs(categoryUrl(c.slug, p)), lastmod: list[0]?.data.date.toISOString() });
  }
  entries.push({ loc: abs('/kategoria/') });
  const archivePages = Math.ceil(all.length / SITE.perPage);
  for (let p = 1; p <= archivePages; p++) entries.push({ loc: abs(p === 1 ? '/archiwum/' : `/archiwum/${p}/`) });
  const months = new Set(all.map((a) => { const { y, m } = monthKey(a.data.date); return `/archiwum/${y}/${m}/`; }));
  for (const m of months) entries.push({ loc: abs(m) });
  // Strony prawne trafiają do mapy dopiero po uzupełnieniu danych właściciela (wcześniej mają noindex).
  const legal = new Set(['/kontakt/', '/polityka-prywatnosci/', '/polityka-cookies/']);
  for (const p of INFO_PAGES) if (ownerDataComplete || !legal.has(p.href)) entries.push({ loc: abs(p.href) });
  entries.push({ loc: abs('/mapa-strony/') });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
