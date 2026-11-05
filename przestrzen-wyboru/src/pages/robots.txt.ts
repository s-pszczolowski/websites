import type { APIRoute } from 'astro';
// Bez SITE_URL (kompilacja testowa) indeksowanie jest zablokowane.
export const GET: APIRoute = ({ site }) => {
  const test = !site || /localhost|127\.0\.0\.1/.test(site.href);
  const body = test ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
