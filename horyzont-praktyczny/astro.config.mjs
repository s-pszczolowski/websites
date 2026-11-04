// @ts-check
import { defineConfig } from 'astro/config';
import { markExternalLinks } from './src/lib/mark-external-links.mjs';

/**
 * Domenę ustawia wyłącznie zmienna SITE_URL (np. SITE_URL=https://horyzontpraktyczny.pl).
 * Bez niej powstaje kompilacja testowa dla http://localhost:4321 z robots.txt blokującym indeksowanie.
 */
const SITE_URL = (process.env.SITE_URL || 'http://localhost:4321').replace(/\/+$/, '');
if (!process.env.SITE_URL) console.warn('[horyzont-praktyczny] Brak SITE_URL – kompilacja testowa (noindex w robots.txt).');

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  markdown: { rehypePlugins: [markExternalLinks], smartypants: false },
});
