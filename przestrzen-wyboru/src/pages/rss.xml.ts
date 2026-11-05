import type { APIRoute } from 'astro';
import { MAGAZINE, rubric } from '../config/magazine';
import { allStories, storyUrl } from '../lib/stories';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const GET: APIRoute = async ({ site }) => {
  const all = (await allStories()).slice(0, 25);
  const items = all.map((s) => `<item><title>${esc(s.data.title)}</title><link>${new URL(storyUrl(s), site).href}</link><guid>${new URL(storyUrl(s), site).href}</guid><pubDate>${s.data.published.toUTCString()}</pubDate><category>${esc(rubric(s.data.rubric).title)}</category><description>${esc(s.data.standfirst)}</description></item>`).join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(MAGAZINE.name)}</title><link>${new URL('/', site).href}</link><description>${esc(MAGAZINE.description)}</description><language>pl</language>${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
