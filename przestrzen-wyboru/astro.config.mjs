// @ts-check
import { defineConfig } from 'astro/config';
import { relAttrs } from './src/lib/rel-attrs.mjs';

// Adres domeny wyłącznie przez zmienną SITE_URL, np. SITE_URL=https://przestrzenwyboru.pl
// Bez niej powstaje kompilacja testowa (robots.txt blokuje indeksowanie).
const SITE_URL = (process.env.SITE_URL || 'http://localhost:4321').replace(/\/+$/, '');
if (!process.env.SITE_URL) console.warn('[przestrzen-wyboru] Brak SITE_URL – kompilacja testowa z blokadą indeksowania.');

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  markdown: { rehypePlugins: [relAttrs], smartypants: false },
});
