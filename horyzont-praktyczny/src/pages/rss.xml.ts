import type { APIRoute } from 'astro';
import { SITE, topic } from '../config/site';
import { allArticles, href } from '../lib/content';
const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const GET: APIRoute = async ({ site }) => {
  const items = (await allArticles()).slice(0, 20).map((e) => `<item><title>${x(e.data.title)}</title><link>${new URL(href(e), site).href}</link><guid>${new URL(href(e), site).href}</guid><pubDate>${e.data.published.toUTCString()}</pubDate><category>${x(topic(e.data.topic).name)}</category><description>${x(e.data.lead)}</description></item>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${x(SITE.name)}</title><link>${new URL('/', site).href}</link><description>${x(SITE.tagline)}</description><language>pl</language>\n${items}\n</channel></rss>\n`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
