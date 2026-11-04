// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeExternalLinks } from './src/lib/rehype-external-links.mjs';

/**
 * Adres domeny ustawiany jest WYŁĄCZNIE przez zmienną środowiskową SITE_URL,
 * np. SITE_URL=https://mapacodziennosci.pl npm run build
 * Bez SITE_URL kompilacja powstaje dla adresu lokalnego i otrzymuje
 * robots.txt blokujący indeksowanie (wersja testowa, nie produkcyjna).
 */
const SITE_URL = (process.env.SITE_URL || 'http://localhost:4321').replace(/\/+$/, '');
if (!process.env.SITE_URL) {
  console.warn('[mapa-codziennosci] Brak SITE_URL – kompilacja testowa dla http://localhost:4321 (noindex w robots.txt).');
}

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  prefetch: false,
  markdown: {
    rehypePlugins: [rehypeExternalLinks],
    smartypants: false,
  },
});
