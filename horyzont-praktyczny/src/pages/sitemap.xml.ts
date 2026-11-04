import type { APIRoute } from 'astro';
import { SITE, TOPICS, INFO_LINKS } from '../config/site';
import { allArticles, href, topicHref, listHref, monthsWithCounts } from '../lib/content';
import { ownerReady } from '../lib/deploy';

export const GET: APIRoute = async ({ site }) => {
  const list = await allArticles();
  const u = (p: string) => new URL(p, site).href;
  const rows: [string, string?][] = [[u('/'), list[0].data.published.toISOString()]];
  list.forEach((e) => rows.push([u(href(e)), (e.data.modified ?? e.data.published).toISOString()]));
  for (const t of TOPICS) {
    const items = list.filter((e) => e.data.topic === t.slug);
    for (let p = 1; p <= Math.ceil(items.length / SITE.topicPageSize); p++) rows.push([u(topicHref(t.slug, p)), items[0]?.data.published.toISOString()]);
  }
  rows.push([u('/temat/')]);
  for (let p = 1; p <= Math.ceil(list.length / SITE.pageSize); p++) rows.push([u(listHref(p))]);
  monthsWithCounts(list).forEach((m) => rows.push([u(`/publikacje/miesiac/${m.key}/`)]));
  const legal = ['/kontakt/', '/polityka-prywatnosci/', '/polityka-cookies/'];
  INFO_LINKS.forEach((l) => { if (ownerReady || !legal.includes(l.href)) rows.push([u(l.href)]); });
  rows.push([u('/mapa-serwisu/')]);
  const body = rows.map(([loc, mod]) => `<url><loc>${loc}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}</url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
