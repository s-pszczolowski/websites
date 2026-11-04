import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => new Response(!site || /localhost|127\.0\.0\.1/.test(site.host) ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
