#!/usr/bin/env node
/**
 * Generuje oryginalne ilustracje artykułów (SVG) oraz grafiki do udostępniania (JPG 1200×630),
 * logo (PNG) i favicon. Ilustracje są deterministyczne – ten sam slug zawsze daje ten sam obraz,
 * więc ponowna kompilacja nie zmienia grafik.
 *
 * Nowy artykuł: dodaj motyw do scripts/motifs.mjs (klucz = slug). Bez motywu artykuł
 * dostanie ilustrację zastępczą działu – walidator zgłosi to jako ostrzeżenie.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { MOTIFS, P } from './motifs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'src/content/articles');
const outSvg = path.join(root, 'public/images/articles');
const outOg = path.join(root, 'public/images/og');
mkdirSync(outSvg, { recursive: true });
mkdirSync(outOg, { recursive: true });

const siteTs = readFileSync(path.join(root, 'src/config/site.ts'), 'utf8');
const catColors = Object.fromEntries([...siteTs.matchAll(/slug: '([^']+)',\s*name: '[^']+',\s*short: '[^']+',\s*color: '([^']+)'/g)].map((m) => [m[1], m[2]]));

const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mix = (hex, to, k) => { const a = hex.match(/\w\w/g).map((x) => parseInt(x, 16)); const b = to.match(/\w\w/g).map((x) => parseInt(x, 16)); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

function illustration(slug, category) {
  const A = catColors[category] ?? P.G;
  const rand = rng(hash(slug));
  const bg = mix(A, '#F7F5F0', 0.86);
  const bg2 = mix(A, '#F7F5F0', 0.7);
  const layout = Math.floor(rand() * 3); // 0: motyw po prawej, 1: centralnie, 2: po lewej
  const mx = [520, 300, 80][layout];
  const decoX = [180, 940, 1000][layout];
  const deco = [];
  for (let i = 0; i < 18; i++) deco.push(`<circle cx="${Math.round(rand() * 1200)}" cy="${Math.round(rand() * 675)}" r="${Math.round(3 + rand() * 5)}" fill="${i % 3 ? A : P.Y}" opacity="${(0.18 + rand() * 0.25).toFixed(2)}"/>`);
  const lines = Array.from({ length: 6 }, (_, i) => `<path d="M${-50 + i * 30} ${520 + i * 26} C 300 ${460 + i * 20 + rand() * 40}, 800 ${600 - rand() * 80}, 1260 ${470 + i * 30}" fill="none" stroke="${P.N}" stroke-opacity=".07" stroke-width="2"/>`).join('');
  const motifFn = MOTIFS[slug];
  const motif = motifFn ? motifFn({ ...P, A }) : `<circle cx="300" cy="300" r="180" fill="${A}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-hidden="true">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
<rect width="1200" height="675" fill="url(#g)"/>
<circle cx="${decoX}" cy="${160 + Math.round(rand() * 300)}" r="${200 + Math.round(rand() * 90)}" fill="${A}" opacity=".16"/>
<circle cx="${mx + 300}" cy="350" r="290" fill="#FFFFFF" opacity=".55"/>
${lines}${deco.join('')}
<g transform="translate(${mx} 45) scale(0.98)">${motif}</g>
<rect x="0" y="663" width="1200" height="12" fill="${A}"/>
</svg>`;
}

const files = readdirSync(contentDir).filter((f) => f.endsWith('.md'));
let missing = [];
for (const f of files) {
  const slug = f.replace(/\.md$/, '');
  const src = readFileSync(path.join(contentDir, f), 'utf8');
  const category = (src.match(/^category:\s*['"]?([\w-]+)/m) || [])[1];
  if (!MOTIFS[slug]) missing.push(slug);
  const svg = illustration(slug, category);
  writeFileSync(path.join(outSvg, `${slug}.svg`), svg);
  const og = path.join(outOg, `${slug}.jpg`);
  await sharp(Buffer.from(svg)).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(og);
}

// Logo, favicon i domyślna grafika OG
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="2" y="2" width="44" height="44" rx="11" fill="#20384D"/><path d="M10 33 L18 15 L25 27 L30 19 L38 33 Z" fill="#718D79"/><circle cx="33" cy="13" r="4.5" fill="#D8AC66"/><path d="M10 37 H38" stroke="#F7F5F0" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 4"/></svg>`;
writeFileSync(path.join(root, 'public/favicon.svg'), mark);
await sharp(Buffer.from(mark)).resize(512, 512).png().toFile(path.join(root, 'public/images/logo.png'));
const ogDefault = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#F7F5F0"/><circle cx="1000" cy="120" r="260" fill="#718D79" opacity=".25"/><circle cx="170" cy="560" r="200" fill="#D8AC66" opacity=".25"/>
<g transform="translate(470 120) scale(5.5)">${mark.replace(/<\/?svg[^>]*>/g, '')}</g>
<rect x="0" y="600" width="1200" height="30" fill="#20384D"/></svg>`;
await sharp(Buffer.from(ogDefault)).jpeg({ quality: 85 }).toFile(path.join(outOg, 'default.jpg'));
console.log(`Ilustracje: ${files.length} artykułów (SVG + JPG OG).${missing.length ? ' Brak motywu dla: ' + missing.join(', ') : ''}`);
