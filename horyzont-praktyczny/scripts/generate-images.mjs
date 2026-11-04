#!/usr/bin/env node
/**
 * Generuje ilustracje artykułów (SVG 1200×800), grafiki udostępniania (JPG 1200×630),
 * logo i favicon. Wynik deterministyczny dla danego sluga.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { MOTIFS, C } from './motifs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src/content/articles');
const out = path.join(root, 'public/img');
mkdirSync(path.join(out, 'share'), { recursive: true });
const cfg = readFileSync(path.join(root, 'src/config/site.ts'), 'utf8');
const colors = Object.fromEntries([...cfg.matchAll(/slug: '([^']+)'[^}]*?color: '([^']+)'/g)].map((m) => [m[1], m[2]]));

let seed = 0;
const hash = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const tint = (hex, k) => '#' + hex.slice(1).match(/../g).map((x) => Math.round(parseInt(x, 16) + (255 - parseInt(x, 16)) * k).toString(16).padStart(2, '0')).join('');

function draw(slug, topic) {
  seed = hash(slug);
  const K = colors[topic] || C.P;
  const pos = [140, 300, 460][Math.floor(rnd() * 3)];
  const grid = [];
  for (let x = 0; x <= 1200; x += 40) grid.push(`<path d="M${x} 0V800" stroke="${C.P}" stroke-opacity="${x % 200 ? .06 : .13}"/>`);
  for (let y = 0; y <= 800; y += 40) grid.push(`<path d="M0 ${y}H1200" stroke="${C.P}" stroke-opacity="${y % 200 ? .06 : .13}"/>`);
  const marks = Array.from({ length: 6 }, () => { const x = Math.round(rnd() * 1100 + 50), y = Math.round(rnd() * 700 + 50); return `<path d="M${x - 10} ${y}h20M${x} ${y - 10}v20" stroke="${C.S}" stroke-opacity=".35" stroke-width="3"/>`; }).join('');
  const motif = (MOTIFS[slug] || (() => `<circle cx="300" cy="300" r="160" fill="${K}"/>`))({ K });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F7FA"/><stop offset="1" stop-color="${tint(K, .82)}"/></linearGradient></defs>
<rect width="1200" height="800" fill="url(#b)"/>${grid.join('')}
<circle cx="${pos + 300}" cy="420" r="330" fill="#FFFFFF" fill-opacity=".7"/>
<path d="M0 ${560 + Math.round(rnd() * 80)}H1200" stroke="${K}" stroke-width="4" stroke-dasharray="14 10" opacity=".55"/>
<circle cx="${pos > 300 ? 170 : 1030}" cy="${150 + Math.round(rnd() * 120)}" r="${56 + Math.round(rnd() * 30)}" fill="${C.A}" fill-opacity=".85"/>
${marks}
<g transform="translate(${pos} 110)">${motif}</g>
<rect x="0" y="788" width="1200" height="12" fill="${K}"/>
</svg>`;
}

const files = readdirSync(src).filter((f) => f.endsWith('.md'));
const missing = [];
for (const f of files) {
  const slug = f.slice(0, -3);
  const topic = (readFileSync(path.join(src, f), 'utf8').match(/^topic:\s*"?([\w-]+)/m) || [])[1];
  if (!MOTIFS[slug]) missing.push(slug);
  const svg = draw(slug, topic);
  writeFileSync(path.join(out, `${slug}.svg`), svg);
  await sharp(Buffer.from(svg)).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(out, 'share', `${slug}.jpg`));
}
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="#176B91"/><path d="M9 25a11 11 0 0 1 22 0Z" fill="#E59A45"/><path d="M6 25h28M10 30h20" stroke="#F4F7FA" stroke-width="2.6" stroke-linecap="round"/></svg>`;
writeFileSync(path.join(root, 'public/favicon.svg'), mark);
await sharp(Buffer.from(mark), { density: 900 }).resize(512, 512).png().toFile(path.join(out, 'logo.png'));
const portal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#172B4D"/><path d="M0 420H1200" stroke="#176B91" stroke-width="6"/><circle cx="600" cy="420" r="190" fill="#E59A45"/><rect y="420" width="1200" height="210" fill="#172B4D"/><path d="M0 420H1200M180 480H1020" stroke="#F4F7FA" stroke-width="10" stroke-linecap="round"/></svg>`;
await sharp(Buffer.from(portal)).jpeg({ quality: 85 }).toFile(path.join(out, 'share', 'portal.jpg'));
console.log(`Ilustracje: ${files.length} (SVG 1200×800 + JPG 1200×630).${missing.length ? ' Brak motywu: ' + missing.join(', ') : ''}`);
