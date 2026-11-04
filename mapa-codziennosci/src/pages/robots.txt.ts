import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const isLocal = !site || /localhost|127\.0\.0\.1/.test(site.host);
  const body = isLocal
    ? `# Kompilacja testowa (brak SITE_URL) – indeksowanie wyłączone\nUser-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
