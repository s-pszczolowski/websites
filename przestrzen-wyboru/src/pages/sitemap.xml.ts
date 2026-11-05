import type { APIRoute } from 'astro';
import { RUBRICS, MAGAZINE } from '../config/magazine';
import { allStories, storyUrl, rubricUrl, archiveUrl, monthsOf, monthUrl, pageCount, isoDate } from '../lib/stories';
import { publisherReady } from '../lib/publisher';

export const GET: APIRoute = async ({ site }) => {
  const all = await allStories();
  const at = (p: string) => new URL(p, site).href;
  const newest = isoDate(all[0].data.published);
  const urls: { loc: string; lastmod?: string }[] = [{ loc: at('/'), lastmod: newest }, { loc: at('/rubryka/') }];
  for (const r of RUBRICS) {
    const mine = all.filter((s) => s.data.rubric === r.slug);
    for (let n = 1; n <= pageCount(mine.length); n++) urls.push({ loc: at(rubricUrl(r.slug, n)), lastmod: n === 1 ? isoDate(mine[0].data.published) : undefined });
  }
  for (let n = 1; n <= pageCount(all.length, MAGAZINE.archivePerPage); n++) urls.push({ loc: at(archiveUrl(n)) });
  for (const m of monthsOf(all)) urls.push({ loc: at(monthUrl(m.ym)) });
  for (const s of all) urls.push({ loc: at(storyUrl(s)), lastmod: isoDate(s.data.revised ?? s.data.published) });
  for (const p of ['/o-magazynie/', '/zasady-publikacji/', '/materialy-partnerskie/', '/spis-tresci/']) urls.push({ loc: at(p) });
  if (publisherReady) for (const p of ['/kontakt/', '/prywatnosc/', '/pliki-cookies/']) urls.push({ loc: at(p) });
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
