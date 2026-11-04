import type { APIRoute } from 'astro';
import { SITE, categoryBySlug } from '../config/site';
import { getArticles, articleUrl } from '../lib/articles';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const all = (await getArticles()).slice(0, 20);
  const items = all.map((a) => `    <item>
      <title>${esc(a.data.title)}</title>
      <link>${new URL(articleUrl(a), site).href}</link>
      <guid isPermaLink="true">${new URL(articleUrl(a), site).href}</guid>
      <pubDate>${a.data.date.toUTCString()}</pubDate>
      <category>${esc(categoryBySlug(a.data.category).name)}</category>
      <description>${esc(a.data.lead)}</description>
    </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${new URL('/', site).href}</link>
    <description>${esc(SITE.tagline)}</description>
    <language>pl</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
