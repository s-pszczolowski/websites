import type { APIRoute } from 'astro';
import { PORTAL, SECTIONS, REGIONS, PAGES } from '../config/portal';
import { stories, link, sectionLink, listLink, months } from '../lib/news';
import { ownerFilled } from '../lib/owner';
export const GET: APIRoute = async ({ site }) => {
  const all = await stories();
  const abs = (p: string) => new URL(p, site).href;
  const urls: { loc: string; mod?: Date }[] = [{ loc: abs('/'), mod: all[0].data.date }];
  for (const s of all) urls.push({ loc: abs(link(s)), mod: s.data.updated ?? s.data.date });
  for (const sec of SECTIONS) { const n = Math.ceil(all.filter((s) => s.data.section === sec.slug).length / PORTAL.perSection); for (let i = 1; i <= n; i++) urls.push({ loc: abs(sectionLink(sec.slug, i)) }); }
  urls.push({ loc: abs('/dzial/') });
  for (const r of REGIONS) urls.push({ loc: abs(`/region/${r.slug}/`) });
  for (let i = 1; i <= Math.ceil(all.length / PORTAL.perList); i++) urls.push({ loc: abs(listLink(i)) });
  for (const m of months(all)) urls.push({ loc: abs(`/najnowsze/${m.ym.slice(0, 4)}/${m.ym.slice(5)}/`) });
  const legal = ['/kontakt/', '/polityka-prywatnosci/', '/cookies/'];
  for (const p of PAGES) if (ownerFilled || !legal.includes(p.href)) urls.push({ loc: abs(p.href) });
  urls.push({ loc: abs('/mapa-serwisu/') });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u.loc}</loc>${u.mod ? `<lastmod>${u.mod.toISOString()}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
