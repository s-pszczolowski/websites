#!/usr/bin/env node
/**
 * Test przeglądarkowy zbudowanego magazynu (dist/) w Chromium (Playwright): 390 px i 1280 px.
 * Sprawdza: brak poziomego przewijania strony, brak błędów JS i odpowiedzi 4xx/5xx, wczytane obrazy,
 * jedno H1, przewijaną nawigację rubryk na telefonie, przejście do rubryki, paginację rubryki,
 * spis treści artykułu (kotwice) i powrót z artykułu do rubryki.
 *   node scripts/browser-check.mjs [katalog-na-zrzuty]   (domyślnie .browser-check/)
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const outDir = path.resolve(process.argv[2] || path.join(root, '.browser-check'));
mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(dist, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404, { 'Content-Type': types['.html'] }); res.end(readFileSync(path.join(dist, '404.html'))); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const pages = ['/', '/rubryka/dom-i-wnetrza/', '/rubryka/zdrowie-i-dobre-samopoczucie/strona-2/', '/swiatlo-w-mieszkaniu-warstwy-oswietlenia/', '/weekend-ze-spa-poza-sezonem/', '/wszystkie-teksty/strona-3/', '/wszystkie-teksty/2026-09/', '/rubryka/', '/spis-tresci/', '/materialy-partnerskie/', '/kontakt/', '/nie-ma-takiej-strony/'];
const viewports = [{ name: 'telefon', width: 390, height: 844 }, { name: 'komputer', width: 1280, height: 900 }];
const browser = await chromium.launch();
const problems = [];
let views = 0;
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' });
  for (const p of pages) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('JS: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('console: ' + m.text()); });
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/nie-ma-takiej-strony/')) errs.push(`HTTP ${r.status()} ${r.url()}`); });
    await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { for (const img of document.images) img.loading = 'eager'; await Promise.all([...document.images].map((img) => img.decode().catch(() => {}))); });
    await page.waitForLoadState('networkidle');
    const r = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      broken: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
      h1: document.querySelectorAll('h1').length,
      fonts: [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family),
    }));
    if (r.overflow > 1) errs.push(`poziome przewijanie strony: ${r.overflow}px`);
    if (r.broken.length) errs.push('niewczytane obrazy: ' + r.broken.join(', '));
    if (r.h1 !== 1) errs.push(`liczba H1: ${r.h1}`);
    if (r.fonts.length) errs.push('niewczytane fonty: ' + r.fonts.join(', '));
    await page.screenshot({ path: path.join(outDir, `${vp.name}${p.replace(/\//g, '_')}.png`), fullPage: p === '/' || p.includes('weekend') });
    if (errs.length) problems.push(`${vp.name} ${p}: ${errs.join('; ')}`);
    views++;
    await page.close();
  }
  // Interakcje: nawigacja rubryk → rubryka → strona 2 → artykuł → spis treści → powrót do rubryki
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const T = '/rubryka/zdrowie-i-dobre-samopoczucie/';
  const link = page.locator(`.rubrics__list a[href="${T}"]`);
  if (vp.width < 900) {
    const scrollable = await page.evaluate(() => { const l = document.querySelector('.rubrics__list'); return l.scrollWidth > l.clientWidth; });
    if (!scrollable) problems.push(`${vp.name}: pasek rubryk nie jest przewijany poziomo (wszystko się mieści?)`);
    await page.evaluate(() => document.querySelector('.rubrics__list').scrollTo({ left: 0 }));
  }
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await page.waitForLoadState('networkidle');
  if (!page.url().endsWith(T)) problems.push(`${vp.name}: przejście do rubryki nie działa (${page.url()})`);
  await page.click('.pager a[rel="next"]');
  await page.waitForLoadState('networkidle');
  if (!page.url().endsWith(T + 'strona-2/')) problems.push(`${vp.name}: paginacja rubryki nie działa (${page.url()})`);
  await page.click('.rubric-grid .tile__title a');
  await page.waitForLoadState('networkidle');
  const toc = page.locator('.contents a').first();
  if (await toc.count()) {
    const href = await toc.getAttribute('href');
    await toc.click();
    await page.waitForTimeout(200);
    if (!decodeURIComponent(page.url()).endsWith(decodeURIComponent(href))) problems.push(`${vp.name}: spis treści nie przenosi do sekcji`);
  } else problems.push(`${vp.name}: brak spisu treści w artykule z rubryki zdrowie`);
  const back = await page.getAttribute('.story__back a', 'href');
  if (back !== T) problems.push(`${vp.name}: powrót z artykułu do rubryki wskazuje ${back}`);
  if (vp.width < 900) {
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    const rail = await page.evaluate(() => { const r = document.querySelector('.band .rail'); return getComputedStyle(r).overflowX === 'auto' && r.scrollWidth > r.clientWidth; });
    if (!rail) problems.push(`${vp.name}: sekcja „Dom i wnętrza” nie przewija się poziomo na telefonie`);
  }
  await page.close();
  await ctx.close();
}
await browser.close();
server.close();
console.log(`Przetestowano ${views} widoków (${pages.length} podstron × ${viewports.length} szerokości) + interakcje (rubryki, paginacja, spis treści, powrót).`);
if (problems.length) { console.log('Problemy:\n' + problems.map((p) => ' ✘ ' + p).join('\n')); process.exit(1); }
console.log('✔ Brak problemów. Zrzuty ekranu: ' + outDir);
