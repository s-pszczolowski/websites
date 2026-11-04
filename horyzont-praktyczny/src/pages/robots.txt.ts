import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => {
  const test = !site || /localhost|127\.0\.0\.1/.test(site.host);
  return new Response(test ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
