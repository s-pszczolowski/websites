// @ts-check
import { defineConfig } from 'astro/config';
import { relLinks } from './src/lib/rel-links.mjs';

// Domena wyłącznie przez SITE_URL (np. SITE_URL=https://pulsregionow.pl). Bez niej: kompilacja testowa z robots.txt „Disallow: /”.
const SITE_URL = (process.env.SITE_URL || 'http://localhost:4321').replace(/\/+$/, '');
if (!process.env.SITE_URL) console.warn('[puls-regionow] Brak SITE_URL – kompilacja testowa.');

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
  markdown: { rehypePlugins: [relLinks], smartypants: false },
});
