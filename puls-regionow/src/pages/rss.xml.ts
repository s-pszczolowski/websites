import type { APIRoute } from 'astro';
import { PORTAL, sectionOf } from '../config/portal';
import { stories, link } from '../lib/news';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const GET: APIRoute = async ({ site }) => {
  const items = (await stories()).slice(0, 20).map((s) => `<item><title>${esc(s.data.title)}</title><link>${new URL(link(s), site).href}</link><guid>${new URL(link(s), site).href}</guid><pubDate>${s.data.date.toUTCString()}</pubDate><category>${esc(sectionOf(s.data.section).label)}</category><description>${esc(s.data.lead)}</description></item>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(PORTAL.name)}</title><link>${new URL('/', site).href}</link><description>${esc(PORTAL.motto)}</description><language>pl</language>\n${items}\n</channel></rss>\n`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
