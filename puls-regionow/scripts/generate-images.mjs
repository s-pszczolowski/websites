#!/usr/bin/env node
/** Generuje ilustracje (SVG 1200×750), grafiki udostępniania (JPG 1200×630), logo i favicon. Deterministycznie dla sluga. */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { MOTIFS, K } from './motifs.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src/content/articles');
const out = path.join(root, 'public/grafika');
mkdirSync(path.join(out, 'udostepnianie'), { recursive: true });
const cfg = readFileSync(path.join(root, 'src/config/portal.ts'), 'utf8');
const tints = Object.fromEntries([...cfg.matchAll(/slug: '([^']+)', label: '[^']+', nav: '[^']+', tint: '([^']+)'/g)].map((m) => [m[1], m[2]]));
const seedOf = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const light = (hex, k) => '#' + hex.slice(1).match(/../g).map((x) => Math.round(parseInt(x, 16) + (255 - parseInt(x, 16)) * k).toString(16).padStart(2, '0')).join('');

function poster(slug, section) {
  let s = seedOf(slug); const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  const t = tints[section] || K.R;
  const x = [80, 300, 520][Math.floor(rnd() * 3)];
  const sunX = x < 300 ? 1000 : 170;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
<defs><pattern id="r" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="2.2" fill="${t}" fill-opacity=".16"/></pattern></defs>
<rect width="1200" height="750" fill="${light(t, .9)}"/><rect width="1200" height="750" fill="url(#r)"/>
<rect x="${x + 40}" y="70" width="520" height="610" fill="#FFFFFF" fill-opacity=".72"/>
<circle cx="${sunX}" cy="${150 + Math.round(rnd() * 160)}" r="${70 + Math.round(rnd() * 40)}" fill="${K.A}" fill-opacity=".9"/>
<rect x="0" y="${600 + Math.round(rnd() * 40)}" width="1200" height="8" fill="${t}" fill-opacity=".5"/>
<g transform="translate(${x} 80) scale(1)">${(MOTIFS[slug] || (() => `<circle cx="300" cy="300" r="180" fill="${t}"/>`))()}</g>
<rect x="0" y="0" width="1200" height="14" fill="${t}"/><rect x="0" y="736" width="1200" height="14" fill="${K.N}"/>
</svg>`;
}
const files = readdirSync(src).filter((f) => f.endsWith('.md'));
const missing = [];
for (const f of files) {
  const slug = f.slice(0, -3);
  const section = (readFileSync(path.join(src, f), 'utf8').match(/^section:\s*"?([\w-]+)/m) || [])[1];
  if (!MOTIFS[slug]) missing.push(slug);
  const svg = poster(slug, section);
  writeFileSync(path.join(out, `${slug}.svg`), svg);
  await sharp(Buffer.from(svg)).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(out, 'udostepnianie', `${slug}.jpg`));
}
const fav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#B33434"/><path d="M4 23h9l3-8 5 14 4-10 3 4h8" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect y="34" width="40" height="6" fill="#E8B75B"/></svg>`;
writeFileSync(path.join(root, 'public/favicon.svg'), fav);
await sharp(Buffer.from(fav), { density: 900 }).resize(512, 512).png().toFile(path.join(out, 'logo.png'));
const share = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#FFFFFF"/><rect width="1200" height="40" fill="#192A3A"/><rect y="560" width="1200" height="70" fill="#B33434"/><path d="M120 330h320l60-150 90 260 80-200 50 90h360" fill="none" stroke="#B33434" stroke-width="22" stroke-linejoin="round" stroke-linecap="round"/><circle cx="1040" cy="190" r="70" fill="#E8B75B"/></svg>`;
await sharp(Buffer.from(share)).jpeg({ quality: 85 }).toFile(path.join(out, 'udostepnianie', 'portal.jpg'));
console.log(`Ilustracje: ${files.length} (SVG 1200×750 + JPG 1200×630).${missing.length ? ' Brak motywu: ' + missing.join(', ') : ''}`);
