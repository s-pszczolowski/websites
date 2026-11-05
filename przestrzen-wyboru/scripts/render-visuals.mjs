#!/usr/bin/env node
/**
 * Generuje własne wizualizacje do artykułów (kompozycje w stylu fotografii wnętrz i martwej natury):
 *  - public/obrazy/<slug>-{640,960,1600}.webp (16:10) – zdjęcia wyróżniające w treści i na kartach,
 *  - public/obrazy/udostepnij/<slug>.jpg (1200×630) – Open Graph,
 *  - public/obrazy/udostepnij/magazyn.jpg, public/favicon.svg, public/obrazy/logo.png.
 * Pomija pliki aktualne (porównanie z datą modyfikacji skryptów). Wymaga pakietu sharp.
 */
import { readdirSync, mkdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { KIT, PALETTES, C, windowView, wallPanels, trainWindow, resetIds } from './visual-kit.mjs';
import { SCENES } from './scenes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/obrazy');
const share = path.join(out, 'udostepnij');
mkdirSync(share, { recursive: true });
const W = 1600; const H = 1000;
const previewAt = process.argv.indexOf('--preview');
if (previewAt > 0) { // podgląd: node scripts/render-visuals.mjs --preview <katalog> [slug…]
  const dir = process.argv[previewAt + 1]; mkdirSync(dir, { recursive: true });
  const list = process.argv.slice(previewAt + 2).length ? process.argv.slice(previewAt + 2) : Object.keys(SCENES);
  for (const s of list) await sharp(Buffer.from(compose(SCENES[s]))).resize(800).jpeg({ quality: 70 }).toFile(path.join(dir, `${s}.jpg`));
  console.log(`Podgląd: ${list.length} scen -> ${dir}`); process.exit(0);
}
const slugs = readdirSync(path.join(root, 'src/content/teksty')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
const stamp = Math.max(...['visual-kit.mjs', 'scenes.mjs', 'render-visuals.mjs'].map((f) => statSync(path.join(root, 'scripts', f)).mtimeMs));

function compose(spec) {
  resetIds();
  const p = PALETTES[spec.palette];
  const horizon = spec.scene === 'table' ? 640 : spec.scene === 'train' ? 760 : 780;
  const defs = `<defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.wall[0]}"/><stop offset="1" stop-color="${p.wall[1]}"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.floor[0]}"/><stop offset="1" stop-color="${p.floor[1]}"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#FFF4DC" stop-opacity=".9"/><stop offset="1" stop-color="#FFF4DC" stop-opacity="0"/></radialGradient>
    <radialGradient id="vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1c1714" stop-opacity=".38"/></radialGradient>
    <linearGradient id="beam" x1="${spec.light === 'right' ? 1 : 0}" y1="0" x2="${spec.light === 'right' ? 0 : 1}" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .55 0"/></filter>
  </defs>`;
  let bg = `<rect width="${W}" height="${H}" fill="url(#wall)"/>`;
  if (spec.scene === 'bath') bg += wallPanels(0, 0, W, horizon, spec.panels.color, spec.panels.variant);
  if (spec.scene === 'table') bg += `<rect y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#floor)"/><rect y="${horizon}" width="${W}" height="10" fill="#fff" opacity=".25"/>`;
  else bg += `<rect y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#floor)"/><rect y="${horizon - 18}" width="${W}" height="18" fill="${C.white}" opacity=".7"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 200 - 100} ${H} L${i * 200 + 60} ${horizon}" stroke="#000" stroke-opacity=".05" stroke-width="3"/>`).join('')}`;
  if (spec.win) bg += windowView(spec.win.x, spec.win.y, spec.win.w, spec.win.h, spec.win.view, spec.win.sky);
  if (spec.scene === 'train') bg += trainWindow(240, 120, 1120, 520, spec.view) + `<rect y="${horizon - 30}" width="${W}" height="40" fill="#6B625A"/>`;
  if (spec.light !== 'none') {
    const l = spec.light === 'right';
    bg += `<polygon points="${l ? `${W},0 ${W - 520},0 ${W - 1150},${H} ${W - 380},${H}` : `0,0 520,0 1150,${H} 380,${H}`}" fill="url(#beam)"/>`;
  }
  const wall = (spec.wall || []).map(([fn, ...a]) => KIT[fn](...a)).join('');
  const zoom = spec.zoom ?? { table: 1.42, room: 1.12, bath: 1.05, train: 1.25 }[spec.scene];
  const zy = spec.scene === 'table' ? 900 : 940;
  const list = (spec.items || []).map((it) => [...it]);
  if (spec.scene === 'table') { // dopasowanie rozstawu do kadru po przybliżeniu
    const span = Math.max(...list.map((it) => Math.abs(it[1] - 800))) || 1;
    const k = Math.min(1, 410 / span);
    for (const it of list) it[1] = Math.round(800 + (it[1] - 800) * k);
  }
  const items = `<g transform="translate(800 ${zy}) scale(${zoom}) translate(-800 -${zy})">${list.map(([fn, ...a]) => KIT[fn](...a)).join('')}</g>`;
  const night = spec.palette === 'night' ? `<rect width="${W}" height="${H}" fill="#14110f" opacity=".12"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs}${bg}${wall}${items}${night}<rect width="${W}" height="${H}" fill="url(#vig)"/><rect width="${W}" height="${H}" filter="url(#grain)" opacity=".16"/></svg>`;
}

let made = 0;
for (const slug of slugs) {
  const spec = SCENES[slug];
  if (!spec) throw new Error(`Brak sceny dla artykułu: ${slug} (scripts/scenes.mjs)`);
  const target = path.join(out, `${slug}-1600.webp`);
  if (existsSync(target) && statSync(target).mtimeMs > stamp && !process.argv.includes('--force')) continue;
  const png = await sharp(Buffer.from(compose(spec))).png().toBuffer();
  for (const w of [640, 960, 1600]) await sharp(png).resize(w).webp({ quality: w === 1600 ? 78 : 74 }).toFile(path.join(out, `${slug}-${w}.webp`));
  await sharp(png).resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(share, `${slug}.jpg`));
  made++;
}

// Identyfikacja: favicon, logo, obraz udostępniania magazynu
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${C.cream}"/><path d="M20 48 V16 h13 a10 10 0 0 1 0 20 H20" fill="none" stroke="${C.terra}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 40 l6 8 l10 -18" fill="none" stroke="${C.sage}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
writeFileSync(path.join(root, 'public/favicon.svg'), favicon);
await sharp(Buffer.from(favicon)).resize(512, 512).png().toFile(path.join(out, 'logo.png'));
const brand = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${C.cream}"/><rect x="0" y="470" width="1200" height="160" fill="${C.sand}"/><circle cx="980" cy="220" r="150" fill="${C.sage}" opacity=".35"/><circle cx="1060" cy="300" r="90" fill="${C.terra}" opacity=".35"/>
<text x="90" y="290" font-family="Georgia, serif" font-size="92" fill="${C.graphite}">Przestrzeń</text><text x="90" y="390" font-family="Georgia, serif" font-style="italic" font-size="92" fill="${C.terra}">Wyboru</text><text x="92" y="560" font-family="Helvetica, Arial, sans-serif" font-size="32" letter-spacing="3" fill="${C.graphite}">ŚWIADOME DECYZJE. LEPSZA CODZIENNOŚĆ</text></svg>`;
await sharp(Buffer.from(brand)).jpeg({ quality: 85 }).toFile(path.join(share, 'magazyn.jpg'));
console.log(`Wizualizacje: ${slugs.length} artykułów (nowe/odświeżone: ${made}), formaty WebP 640/960/1600 + JPG 1200×630.`);
