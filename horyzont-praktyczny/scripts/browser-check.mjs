#!/usr/bin/env node
/**
 * Test przeglądarkowy zbudowanej strony (dist/) w Chromium (Playwright):
 * szerokości 390 px (telefon) i 1280 px (komputer); brak poziomego przewijania,
 * brak błędów JS i odpowiedzi 4xx/5xx, poprawnie wczytane obrazy, działające menu mobilne,
 * paginacja i nawigacja do kategorii. Zrzuty ekranu: katalog podany jako argument
 * (domyślnie .browser-check/).
 *   node scripts/browser-check.mjs [katalog-na-zrzuty]
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

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(dist, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404, { 'Content-Type': types['.html'] }); res.end(readFileSync(path.join(dist, '404.html'))); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const pages = ['/', '/temat/zdrowie-i-medycyna/', '/temat/dom-i-nieruchomosci/strona/2/', '/zakup-mieszkania-od-dewelopera/', '/ppk-pracownicze-plany-kapitalowe/', '/publikacje/strona/3/', '/publikacje/miesiac/2026-09/', '/redakcja/', '/tresci-sponsorowane/', '/temat/', '/mapa-serwisu/', '/nie-ma-takiej-strony/'];
const viewports = [{ name: 'telefon', width: 390, height: 844 }, { name: 'komputer', width: 1280, height: 900 }];
const browser = await chromium.launch();
const problems = [];
let views = 0;
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  for (const p of pages) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('JS: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('console: ' + m.text()); });
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/nie-ma-takiej-strony/')) errs.push(`HTTP ${r.status()} ${r.url()}`); });
    await page.goto(base + p, { waitUntil: 'networkidle' });
    // Obrazy mają loading="lazy" – na potrzeby testu wymuszamy wczytanie i dekodowanie każdego z nich.
    await page.evaluate(async () => {
      for (const img of document.images) img.loading = 'eager';
      await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
    });
    await page.waitForLoadState('networkidle');
    const r = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      brokenImgs: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
      h1: document.querySelectorAll('h1').length,
    }));
    if (r.overflow > 1) errs.push(`poziome przewijanie: ${r.overflow}px`);
    if (r.brokenImgs.length) errs.push('niewczytane obrazy: ' + r.brokenImgs.join(', '));
    if (r.h1 !== 1) errs.push(`liczba H1: ${r.h1}`);
    const shot = path.join(outDir, `${vp.name}${p.replace(/\//g, '_') || '_'}.png`);
    await page.screenshot({ path: shot, fullPage: p === '/' || p.startsWith('/weekend') });
    if (errs.length) problems.push(`${vp.name} ${p}: ${errs.join('; ')}`);
    views++;
    await page.close();
  }
  // Interakcje
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const T = '/temat/zdrowie-i-medycyna/';
  if (vp.width < 1080) {
    await page.click('.hdr__burger');
    await page.waitForTimeout(400);
    const visible = await page.isVisible(`.drawer__list a[href="${T}"]`);
    const panel = await page.evaluate(() => { const r = document.querySelector('.drawer__panel').getBoundingClientRect(); return { h: r.height, left: r.left }; });
    if (!visible || panel.h < vp.height * 0.9 || panel.left < -1) problems.push(`${vp.name}: menu mobilne nie otwiera się na pełną wysokość (wys. ${Math.round(panel.h)} px)`);
    await page.screenshot({ path: path.join(outDir, `${vp.name}_menu.png`) });
    await page.click(`.drawer__list a[href="${T}"]`);
  } else {
    await page.click(`.hdr__nav a[href="${T}"]`);
  }
  await page.waitForLoadState('networkidle');
  if (!page.url().endsWith(T)) problems.push(`${vp.name}: nawigacja do tematu nie działa`);
  await page.click('.pager a[rel="next"]');
  await page.waitForLoadState('networkidle');
  if (!page.url().endsWith(T + 'strona/2/')) problems.push(`${vp.name}: paginacja tematu nie działa (${page.url()})`);
  await page.click('.with-side__main .card__title a');
  await page.waitForLoadState('networkidle');
  const backHref = await page.getAttribute('.art-main a.btn--outline', 'href');
  if (backHref !== T) problems.push(`${vp.name}: brak powrotu do tematu z artykułu`);
  await page.close();
  await ctx.close();
}
await browser.close();
server.close();
console.log(`Przetestowano ${views} widoków (${pages.length} podstron × ${viewports.length} szerokości) + interakcje (menu, kategoria, paginacja, powrót).`);
if (problems.length) { console.log('Problemy:\n' + problems.map((p) => ' ✘ ' + p).join('\n')); process.exit(1); }
console.log('✔ Brak problemów. Zrzuty ekranu: ' + outDir);
