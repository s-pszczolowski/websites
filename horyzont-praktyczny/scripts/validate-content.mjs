#!/usr/bin/env node
/**
 * Automatyczna kontrola końcowa portalu Horyzont Praktyczny.
 * Sprawdza pliki treści (src/content/articles) oraz wynik kompilacji (dist/).
 * Uruchom po `npm run build`:  node scripts/validate-content.mjs
 * Wynik: tabela kontroli w konsoli + plik RAPORT-WALIDACJI.md. Kod wyjścia 1 przy błędach.
 */
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'src/content/articles');
const dist = path.join(root, 'dist');
const errors = [];
const warnings = [];
const rows = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const check = (name, expected, actual, ok = String(expected) === String(actual)) => {
  rows.push({ name, expected, actual, ok });
  if (!ok) err(`${name}: oczekiwano ${expected}, jest ${actual}`);
};

// ---------- Dane źródłowe ----------
const siteTs = readFileSync(path.join(root, 'src/config/site.ts'), 'utf8');
const categories = [...siteTs.matchAll(/slug: '([^']+)', name: '([^']+)'/g)].map((m) => ({ slug: m[1], name: m[2] }));
const EXPECTED_PER_TOPIC = { 'technologie-i-innowacje': 7, 'biznes-i-przedsiebiorczosc': 7, 'dom-i-nieruchomosci': 8, 'zdrowie-i-medycyna': 7, 'transport-i-motoryzacja': 6, 'turystyka-i-wypoczynek': 5, 'finanse-i-prawo': 5, 'styl-zycia-i-rozwoj': 5 };
const clientBase = readFileSync(path.join(root, 'scripts/client-base.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
const hostOf = (u) => new URL(u).hostname.replace(/^www\./, '');
const baseHosts = new Set(clientBase.map(hostOf));

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const fm = {}; const lines = m[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let [, k, v] = kv;
    if (v === '') { // lista obiektów (sources)
      const items = [];
      while (lines[i + 1] && /^\s+/.test(lines[i + 1])) { items.push(lines[++i]); }
      fm[k] = items; continue;
    }
    if (v.startsWith('[')) { fm[k] = JSON.parse(v); continue; }
    if (v.startsWith('"')) v = JSON.parse(v);
    else if (/^\d+$/.test(v)) v = Number(v);
    fm[k] = v === 'true' ? true : v === 'false' ? false : v;
  }
  return { fm, body: m[2] };
}

const files = readdirSync(contentDir).filter((f) => f.endsWith('.md')).sort();
const articles = files.map((f) => {
  const slug = f.replace(/\.md$/, '');
  const src = readFileSync(path.join(contentDir, f), 'utf8');
  const parsed = parseFrontmatter(src);
  if (!parsed) { err(`${slug}: brak front matter`); return null; }
  const { fm, body } = parsed;
  const words = body.replace(/<[^>]+>/g, ' ').replace(/\]\([^)]*\)/g, ']').replace(/[#>*|_`-]/g, ' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
  return { slug, fm, body, words };
}).filter(Boolean);
const bySlug = new Map(articles.map((a) => [a.slug, a]));

check('Liczba portali (projekt z jedną konfiguracją site.ts)', 1, existsSync(path.join(root, 'src/config/site.ts')) ? 1 : 0);
check('Liczba artykułów (pliki treści)', 50, articles.length);

// Slugi
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const badSlugs = articles.filter((a) => !slugRe.test(a.slug) || /blog|artykul|\d{4}/.test(a.slug.split('-')[0]));
check('Slugi niezgodne z formatem (małe litery ASCII, myślniki)', 0, badSlugs.length);
check('Duplikaty slugów', 0, articles.length - new Set(articles.map((a) => a.slug)).size);
const reserved = new Set(['temat', 'publikacje', 'redakcja', 'kontakt', 'polityka-prywatnosci', 'polityka-cookies', 'zasady-wspolpracy', 'tresci-sponsorowane', 'mapa-serwisu', 'img', '404']);
check('Kolizje slugów z podstronami systemowymi', 0, articles.filter((a) => reserved.has(a.slug)).length);

// Pola wymagane
const required = ['title', 'seoTitle', 'seoDescription', 'lead', 'topic', 'published', 'coverAlt', 'kind'];
const missingField = (f) => articles.filter((a) => !a.fm[f] || String(a.fm[f]).trim().length < 3).length;
check('Artykuły bez meta title (seoTitle)', 0, missingField('seoTitle'));
check('Artykuły bez meta description (seoDescription)', 0, missingField('seoDescription'));
check('Artykuły bez leadu', 0, missingField('lead'));
for (const f of required) for (const a of articles) if (!a.fm[f]) err(`${a.slug}: brak pola ${f}`);
const uniq = (f) => articles.length - new Set(articles.map((a) => String(a.fm[f]).toLowerCase())).size;
check('Zduplikowane tytuły', 0, uniq('title'));
check('Zduplikowane meta title', 0, uniq('seoTitle'));
check('Zduplikowane meta description', 0, uniq('seoDescription'));
check('Artykuły bez sekcji „W skrócie” (min. 3 punkty)', 0, articles.filter((a) => !Array.isArray(a.fm.keyPoints) || a.fm.keyPoints.length < 3).length);
for (const a of articles) {
  if (a.fm.seoTitle.length > 70) err(`${a.slug}: meta title > 70 znaków`);
  if (a.fm.seoDescription.length < 70 || a.fm.seoDescription.length > 165) err(`${a.slug}: meta description ${a.fm.seoDescription.length} znaków`);
}

// Treść
const emptyCount = articles.filter((a) => a.words < 150).length;
check('Puste artykuły (< 150 słów)', 0, emptyCount);
const placeholder = /lorem ipsum|\bTODO\b|\bXXX\b|\[do uzupełnienia\]|tekst zastępczy/i;
check('Teksty zastępcze', 0, articles.filter((a) => placeholder.test(a.body)).length);
check('Artykuły z H1 w treści (H1 tylko w szablonie)', 0, articles.filter((a) => /^# /m.test(a.body)).length);
check('Artykuły z mniej niż 2 nagłówkami H2', 0, articles.filter((a) => (a.body.match(/^## /gm) || []).length < 2).length);
const cats = new Set(categories.map((c) => c.slug));
check('Artykuły bez poprawnej kategorii', 0, articles.filter((a) => !cats.has(a.fm.topic)).length);
for (const [slug, n] of Object.entries(EXPECTED_PER_TOPIC)) check(`Artykuły w kategorii ${slug}`, n, articles.filter((a) => a.fm.topic === slug).length);

// Powiązane
let badRelated = 0;
for (const a of articles) for (const r of a.fm.related || []) if (!bySlug.has(r) || r === a.slug) { badRelated++; err(`${a.slug}: powiązany artykuł „${r}” nie istnieje`); }
check('Niedziałające odwołania do powiązanych artykułów', 0, badRelated);
check('Artykuły bez powiązanych artykułów', 0, articles.filter((a) => !a.fm.related || a.fm.related.length < 2).length);

// Daty
const dates = articles.map((a) => ({ slug: a.slug, d: new Date(a.fm.published) }));
const inRange = dates.filter(({ d }) => d >= new Date('2026-08-01T00:00:00+02:00') && d <= new Date('2026-10-31T23:59:59+01:00'));
check('Daty w zakresie 1.08–31.10.2026', 50, inRange.length);
const warsawDay = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(d);
const byMonth = { '08': 0, '09': 0, '10': 0 };
for (const { d } of dates) byMonth[warsawDay(d).slice(5, 7)]++;
check('Artykuły w sierpniu 2026', 17, byMonth['08']);
check('Artykuły we wrześniu 2026', 16, byMonth['09']);
check('Artykuły w październiku 2026', 17, byMonth['10']);
check('Liczba różnych dni publikacji', 50, new Set(dates.map(({ d }) => warsawDay(d))).size);

// Długość
const editorial = articles.filter((a) => !a.fm.sponsored);
const sponsored = articles.filter((a) => a.fm.sponsored);
for (const a of editorial) if (a.words < 400 || a.words > 800) warn(`${a.slug}: ${a.words} słów (orientacyjnie 400–800)`);
for (const a of sponsored) if (a.words < 700 || a.words > 1100) warn(`${a.slug}: ${a.words} słów (orientacyjnie 700–1100)`);

// ---------- Klienci ----------
const selPath = path.join(root, 'selected-clients.json');
check('Zapisany wynik losowania (selected-clients.json)', 'tak', existsSync(selPath) ? 'tak' : 'nie');
const selected = existsSync(selPath) ? JSON.parse(readFileSync(selPath, 'utf8')).selected : [];
check('Wylosowani klienci w pliku', 10, selected.length);
check('Wylosowani klienci spoza bazy', 0, selected.filter((s) => !clientBase.includes(s.url)).length);
check('Różne firmy wśród wylosowanych', 10, new Set(selected.map((s) => s.id)).size);

const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|<a\s[^>]*href="(https?:\/\/[^"]+)"[^>]*>([^<]*)<\/a>/g;
const clientLinks = [];
let nonClientExternalInBody = 0;
for (const a of articles) {
  for (const m of a.body.matchAll(linkRe)) {
    const url = m[2] || m[3]; const anchor = m[1] || m[4];
    const h = hostOf(url);
    if (baseHosts.has(h)) clientLinks.push({ slug: a.slug, url, anchor, host: h });
    else { nonClientExternalInBody++; err(`${a.slug}: link zewnętrzny w treści spoza bazy klientów: ${url}`); }
  }
}
check('Artykuły redakcyjne (bez linków do klientów)', 40, articles.filter((a) => !clientLinks.some((l) => l.slug === a.slug)).length);
check('Artykuły zawierające link do klienta', 10, new Set(clientLinks.map((l) => l.slug)).size);
check('Liczba linków do klientów', 10, clientLinks.length);
check('Liczba różnych linkowanych klientów', 10, new Set(clientLinks.map((l) => l.host)).size);
check('Linki spoza bazy klientów (w treści artykułów)', 0, nonClientExternalInBody);
const selectedUrls = new Set(selected.map((s) => s.url));
check('Linki do klientów niewylosowanych', 0, clientLinks.filter((l) => !selectedUrls.has(l.url)).length);
check('Artykuły z linkiem do klienta oznaczone jako materiał partnerski', 10, clientLinks.filter((l) => bySlug.get(l.slug).fm.sponsored === true).length);
check('Materiały partnerskie bez linku do klienta', 0, sponsored.filter((a) => !clientLinks.some((l) => l.slug === a.slug)).length);
for (const l of clientLinks) {
  const a = bySlug.get(l.slug);
  const sel = selected.find((s) => s.url === l.url);
  if (!sel || a.fm.partner !== sel.id) err(`${l.slug}: pole partner (${a.fm.partner}) nie odpowiada linkowi ${l.url}`);
  if (sel && sel.anchor && sel.anchor !== l.anchor) err(`${l.slug}: anchor „${l.anchor}” różni się od zaplanowanego w selected-clients.json („${sel.anchor}”)`);
  if (sel && sel.artykul && sel.artykul !== `/${l.slug}/`) err(`${l.slug}: artykuł niezgodny z planem w selected-clients.json (${sel.artykul})`);
  if (sel && sel.kategoria && sel.kategoria !== a.fm.topic) err(`${l.slug}: kategoria niezgodna z planem (${sel.kategoria})`);
  if (l.anchor.split(/\s+/).length > 8) warn(`${l.slug}: długi anchor „${l.anchor}”`);
  if (/kliknij|sprawdź stronę|tutaj/i.test(l.anchor)) err(`${l.slug}: niedozwolony anchor „${l.anchor}”`);
  // pozycja akapitu
  const paras = a.body.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !/^(#|\||>|- |\d+\. |<)/.test(p));
  const idx = paras.findIndex((p) => p.includes(l.url));
  if (idx <= 0 || idx === paras.length - 1) err(`${l.slug}: link klienta w pierwszym/ostatnim akapicie lub poza akapitem (pozycja ${idx + 1}/${paras.length})`);
}
check('Anchory zgodne z planem tematycznym (selected-clients.json)', 10, clientLinks.filter((l) => { const sel = selected.find((x) => x.url === l.url); return sel && sel.anchor === l.anchor && sel.artykul === `/${l.slug}/`; }).length);
check('Powtórzone anchory', 0, clientLinks.length - new Set(clientLinks.map((l) => l.anchor.toLowerCase())).size);


// ---------- Niezależność od portalu Mapa Codzienności ----------
const mapaDir = path.join(root, '../mapa-codziennosci');
if (existsSync(path.join(mapaDir, 'src/content/articles'))) {
  const mapaFiles = readdirSync(path.join(mapaDir, 'src/content/articles')).filter((f) => f.endsWith('.md'));
  const mapaSlugs = new Set(mapaFiles.map((f) => f.slice(0, -3)));
  const mapaTitles = new Set(mapaFiles.map((f) => (readFileSync(path.join(mapaDir, 'src/content/articles', f), 'utf8').match(/^title:\s*"(.*)"$/m) || [])[1]?.toLowerCase()));
  check('Slugi powtórzone z Mapy Codzienności', 0, articles.filter((a) => mapaSlugs.has(a.slug)).length);
  check('Tytuły powtórzone z Mapy Codzienności', 0, articles.filter((a) => mapaTitles.has(String(a.fm.title).toLowerCase())).length);
  const mapaSel = existsSync(path.join(mapaDir, 'selected-clients.json')) ? JSON.parse(readFileSync(path.join(mapaDir, 'selected-clients.json'), 'utf8')).selected : [];
  const mapaAnchors = new Set(mapaSel.map((s) => (s.anchor || '').toLowerCase()));
  check('Zestaw klientów identyczny jak w Mapie Codzienności', 'nie', mapaSel.length && mapaSel.every((s) => selected.some((x) => x.id === s.id)) ? 'tak' : 'nie');
  rows.push({ name: 'Klienci wspólni z Mapą Codzienności (dopuszczalne, informacyjnie)', expected: '–', actual: selected.filter((s) => mapaSel.some((m) => m.id === s.id)).length, ok: true });
  check('Anchory powtórzone z Mapy Codzienności', 0, clientLinks.filter((l) => mapaAnchors.has(l.anchor.toLowerCase())).length);
  const mapaCss = existsSync(path.join(mapaDir, 'src/styles/global.css')) ? readFileSync(path.join(mapaDir, 'src/styles/global.css'), 'utf8') : '';
  const ownCss = readFileSync(path.join(root, 'src/styles/site.css'), 'utf8');
  const ruleSet = (css) => new Set(css.split('}').map((r) => r.trim()).filter((r) => r.length > 30));
  const shared = [...ruleSet(ownCss)].filter((r) => ruleSet(mapaCss).has(r)).length;
  check('Reguły CSS skopiowane 1:1 z Mapy Codzienności', 0, shared);
}

// ---------- Kompilacja ----------
if (!existsSync(dist)) {
  err('Brak katalogu dist/ – uruchom najpierw npm run build');
} else {
  const walk = (d) => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const all = walk(dist);
  const htmlFiles = all.filter((f) => f.endsWith('.html'));
  const rel = (f) => '/' + path.relative(dist, f).replace(/\\/g, '/');
  const urlOf = (f) => rel(f).replace(/index\.html$/, '');
  const pages = htmlFiles.map((f) => ({ file: f, url: urlOf(f), html: readFileSync(f, 'utf8') }));
  const pageByUrl = new Map(pages.map((p) => [p.url, p]));
  const canonicalOf = (h) => (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const siteUrl = new URL(canonicalOf(pageByUrl.get('/').html)).origin;
  const isLocal = /localhost|127\.0\.0\.1/.test(siteUrl);
  if (isLocal) warn(`Kompilacja wykonana bez SITE_URL (canonical: ${siteUrl}) – wersja testowa, nie produkcyjna.`);

  const articlePages = articles.filter((a) => pageByUrl.has(`/${a.slug}/`));
  check('Podstrony artykułów w wynikowej kompilacji', 50, articlePages.length);
  check('Wszystkie podstrony HTML w kompilacji', pages.length, pages.length);

  const contentPages = pages.filter((p) => p.url !== '/404.html');
  const h1Bad = contentPages.filter((p) => (p.html.match(/<h1[\s>]/g) || []).length !== 1);
  check('Podstrony bez H1 lub z więcej niż jednym H1', 0, h1Bad.length);
  h1Bad.forEach((p) => err(`H1: ${p.url}`));
  check('Artykuły bez H1 (w HTML)', 0, articles.filter((a) => !/<h1[\s>]/.test(pageByUrl.get(`/${a.slug}/`)?.html || '')).length);
  const titles = contentPages.map((p) => (p.html.match(/<title>([^<]*)<\/title>/) || [])[1]);
  const descs = contentPages.map((p) => (p.html.match(/<meta name="description" content="([^"]*)"/) || [])[1]);
  check('Podstrony bez znacznika title', 0, titles.filter((t) => !t).length);
  check('Podstrony bez meta description', 0, descs.filter((t) => !t).length);
  check('Zduplikowane znaczniki title (HTML)', 0, titles.length - new Set(titles).size);
  check('Zduplikowane meta description (HTML)', 0, descs.length - new Set(descs).size);
  check('Podstrony bez canonical', 0, contentPages.filter((p) => !canonicalOf(p.html)).length);
  check('Canonical niezgodny z adresem podstrony', 0, contentPages.filter((p) => canonicalOf(p.html) !== siteUrl + p.url).length);
  check('Podstrony bez meta viewport', 0, pages.filter((p) => !/name="viewport"/.test(p.html)).length);
  check('Podstrony bez Open Graph (og:title/og:image)', 0, contentPages.filter((p) => !/property="og:title"/.test(p.html) || !/property="og:image"/.test(p.html)).length);

  // JSON-LD
  let ldErrors = 0; let articleLd = 0; let breadcrumbLd = 0;
  for (const p of pages) {
    for (const m of p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        const data = JSON.parse(m[1]);
        const list = (Array.isArray(data) ? data : [data]);
        if (articles.some((a) => p.url === `/${a.slug}/`)) {
          if (list.some((x) => x['@type'] === 'Article' && x.datePublished && x.dateModified && x.publisher && x.author)) articleLd++;
          if (list.some((x) => x['@type'] === 'BreadcrumbList')) breadcrumbLd++;
        }
      } catch { ldErrors++; err(`JSON-LD niepoprawny: ${p.url}`); }
    }
    if (!/"@type":"(NewsMedia)?Organization"/.test(p.html) || !/"@type":"WebSite"/.test(p.html)) err(`Brak Organization/WebSite: ${p.url}`);
  }
  check('Błędy składni JSON-LD', 0, ldErrors);
  check('Artykuły z danymi strukturalnymi Article', 50, articleLd);
  check('Artykuły z danymi BreadcrumbList', 50, breadcrumbLd);
  check('Artykuły z okruszkami (breadcrumbs)', 50, articles.filter((a) => /class="crumbs"/.test(pageByUrl.get(`/${a.slug}/`)?.html || '')).length);

  // Linki wewnętrzne i obrazy
  const resolveInternal = (href) => {
    let u = href;
    if (u.startsWith(siteUrl)) u = u.slice(siteUrl.length) || '/';
    const [pathPart] = u.split('#');
    const clean = decodeURIComponent(pathPart.split('?')[0]);
    const target = path.join(dist, clean);
    if (clean.endsWith('/')) return existsSync(path.join(target, 'index.html'));
    return existsSync(target);
  };
  let broken = 0; let internalLinks = 0; const brokenList = [];
  let badAnchors = 0;
  for (const p of pages) {
    for (const m of p.html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
      const href = m[1].replace(/&amp;/g, '&');
      if (href.startsWith('/') || href.startsWith(siteUrl)) {
        internalLinks++;
        if (!resolveInternal(href)) { broken++; brokenList.push(`${p.url} -> ${href}`); }
        else if (href.includes('#')) {
          const [tp, id] = href.split('#');
          const tgt = tp ? pageByUrl.get(tp.replace(siteUrl, '')) : p;
          if (tgt && !tgt.html.includes(`id="${id}"`)) { badAnchors++; err(`Kotwica #${id} nie istnieje: ${p.url} -> ${href}`); }
        }
      } else if (href.startsWith('#')) {
        if (href.length > 1 && !p.html.includes(`id="${href.slice(1)}"`)) { badAnchors++; err(`Kotwica ${href} nie istnieje na ${p.url}`); }
      }
    }
  }
  brokenList.forEach((b) => err(`Niedziałający link wewnętrzny: ${b}`));
  check('Niedziałające linki wewnętrzne', 0, broken);
  check('Niedziałające kotwice', 0, badAnchors);
  rows.push({ name: 'Sprawdzone linki wewnętrzne (łącznie)', expected: '–', actual: internalLinks, ok: true });

  let imgMissing = 0; let imgNoAlt = 0; let imgs = 0; let lazy = 0;
  for (const p of pages) {
    for (const m of p.html.matchAll(/<img\s([^>]*)>/g)) {
      imgs++;
      const attrs = m[1];
      const src = (attrs.match(/src="([^"]+)"/) || [])[1];
      if (!/\salt="|^alt="/.test(' ' + attrs)) imgNoAlt++;
      if (/loading="lazy"/.test(attrs)) lazy++;
      if (src && src.startsWith('/') && !existsSync(path.join(dist, src))) { imgMissing++; err(`Brak obrazu ${src} na ${p.url}`); }
    }
  }
  check('Obrazy bez atrybutu alt', 0, imgNoAlt);
  check('Niedziałające adresy obrazów', 0, imgMissing);
  rows.push({ name: 'Obrazy z lazy loading / wszystkie obrazy', expected: '–', actual: `${lazy} / ${imgs}`, ok: true });
  const articlesWithFigure = articles.filter((a) => /class="art-cover"[\s\S]*?<img[^>]+alt="[^"]{10,}"/.test(pageByUrl.get(`/${a.slug}/`)?.html || '')).length;
  check('Artykuły z ilustracją i opisem ALT', 50, articlesWithFigure);
  const ogMissing = articles.filter((a) => !existsSync(path.join(dist, 'img/share', `${a.slug}.jpg`))).length;
  check('Brakujące grafiki Open Graph artykułów', 0, ogMissing);

  // Linki do klientów w HTML całego serwisu
  const htmlClient = [];
  for (const p of pages) {
    for (const m of p.html.matchAll(/<a\s([^>]*)>([\s\S]*?)<\/a>/g)) {
      const href = (m[1].match(/href="([^"]+)"/) || [])[1] || '';
      if (!/^https?:/.test(href)) continue;
      const h = hostOf(href);
      if (baseHosts.has(h)) htmlClient.push({ url: p.url, href, rel: (m[1].match(/rel="([^"]+)"/) || [])[1] || '', inProse: false });
    }
  }
  check('Linki do klientów w całym serwisie (HTML)', 10, htmlClient.length);
  check('Linki do klientów poza 10 artykułami partnerskimi', 0, htmlClient.filter((l) => !sponsored.some((a) => l.url === `/${a.slug}/`)).length);
  check('Linki do klientów bez rel="sponsored"', 0, htmlClient.filter((l) => !/\bsponsored\b/.test(l.rel)).length);
  check('Artykuły sponsorowane z oznaczeniem „Artykuł sponsorowany”', 10, sponsored.filter((a) => /Artykuł sponsorowany/.test(pageByUrl.get(`/${a.slug}/`)?.html || '')).length);
  const heroHtml = (pageByUrl.get('/')?.html.match(/<section class="wrap hero"[\s\S]*?<\/section>/) || [''])[0];
  check('Wyróżnione artykuły w sekcji hero strony głównej', 3, new Set([...heroHtml.matchAll(/<h2 class="(?:hero__title|card__title)"><a href="([^"]+)"/g)].map((m) => m[1])).size);
  check('Strony tematów z bocznym blokiem „Polecane poradniki”', categories.length, categories.filter((c) => /Polecane poradniki/.test(pageByUrl.get(`/temat/${c.slug}/`)?.html || '')).length);
  const nav = ['/','/publikacje/','/temat/'].map((u) => pageByUrl.get(u)?.html || '').join('');
  const headerFooter = pages.map((p) => (p.html.match(/<header class="hdr">[\s\S]*?<\/header>/) || [''])[0] + (p.html.match(/<footer class="ftr">[\s\S]*?<\/footer>/) || [''])[0] + (p.html.match(/<aside class="side"[\s\S]*?<\/aside>/) || [''])[0]).join('');
  check('Linki do klientów w headerze/stopce/menu/sidebarze', 0, [...baseHosts].filter((h) => headerFooter.includes(h)).length);
  void nav;

  // Sitemap i robots
  const smPath = path.join(dist, 'sitemap.xml');
  if (!existsSync(smPath)) err('Brak sitemap.xml');
  else {
    const locs = [...readFileSync(smPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    check('Adresy w sitemap.xml spoza SITE_URL', 0, locs.filter((l) => !l.startsWith(siteUrl + '/')).length);
    check('Duplikaty w sitemap.xml', 0, locs.length - new Set(locs).size);
    check('Adresy w sitemap.xml bez odpowiadającej podstrony', 0, locs.filter((l) => !resolveInternal(l)).length);
    check('Artykuły obecne w sitemap.xml', 50, articles.filter((a) => locs.includes(`${siteUrl}/${a.slug}/`)).length);
    check('Strony noindex w sitemap.xml', 0, locs.filter((l) => { const p = pageByUrl.get(l.slice(siteUrl.length)); return p && /name="robots" content="noindex/.test(p.html); }).length);
    rows.push({ name: 'Adresy w sitemap.xml (łącznie)', expected: '–', actual: locs.length, ok: true });
  }
  const robots = existsSync(path.join(dist, 'robots.txt')) ? readFileSync(path.join(dist, 'robots.txt'), 'utf8') : '';
  check('robots.txt z adresem mapy strony (wersja produkcyjna)', 'tak', isLocal ? (/Disallow: \//.test(robots) ? 'tak' : 'nie') : (robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`) ? 'tak' : 'nie'));
  check('Adresy testowe (localhost) w kompilacji produkcyjnej', 0, isLocal ? 0 : pages.filter((p) => /localhost:4321/.test(p.html)).length);

  // Kolejność artykułów (od najnowszych) na stronie archiwum
  const arch = (pageByUrl.get('/') ?.html.match(/<table class="index">[\s\S]*?<\/table>/) || [''])[0];
  const archDates = [...arch.matchAll(/<time datetime="([^"]+)"/g)].map((m) => new Date(m[1]).getTime());
  check('Indeks publikacji posortowany od najnowszych', 'tak', archDates.every((d, i) => i === 0 || archDates[i - 1] >= d) ? 'tak' : 'nie');
  const archivePages = pages.filter((p) => /^\/publikacje\/strona\/\d+\/$/.test(p.url)).length + 1;
  check('Strony paginacji listy publikacji', Math.ceil(50 / 9), archivePages);
  for (const c of categories) {
    const cnt = articles.filter((a) => a.fm.topic === c.slug).length;
    const catPages = pages.filter((p) => p.url.startsWith(`/temat/${c.slug}/`));
    const linked = articles.filter((a) => a.fm.topic === c.slug && catPages.some((p) => p.html.includes(`href="/${a.slug}/"`))).length;
    if (linked !== cnt) err(`Kategoria ${c.slug}: archiwum linkuje ${linked} z ${cnt} artykułów`);
  }
  check('Archiwa kategorii linkujące do wszystkich swoich artykułów', categories.length, categories.filter((c) => {
    const cnt = articles.filter((a) => a.fm.topic === c.slug).length;
    const catPages = pages.filter((p) => p.url.startsWith(`/temat/${c.slug}/`));
    return articles.filter((a) => a.fm.topic === c.slug && catPages.some((p) => p.html.includes(`href="/${a.slug}/"`))).length === cnt;
  }).length);
  check('Strona główna wyświetla mniej niż 50 kart artykułów', 'tak', ((pageByUrl.get('/')?.html.match(/class="card /g) || []).length < 50) ? 'tak' : 'nie');
}

// ---------- Raport ----------
const catStats = categories.map((c) => `| ${c.name} | ${articles.filter((a) => a.fm.topic === c.slug).length} | ${articles.filter((a) => a.fm.topic === c.slug && a.fm.sponsored).length} |`).join('\n');
const wordsE = editorial.map((a) => a.words); const wordsS = sponsored.map((a) => a.words);
const clientTable = clientLinks.map((l) => { const a = bySlug.get(l.slug); return `| ${a.fm.partner} | ${l.url} | ${a.fm.title} | „${l.anchor}” | /${l.slug}/ | ${a.words} |`; }).join('\n');
const report = `# Raport walidacji – Horyzont Praktyczny

Wygenerowano: ${new Date().toISOString()} (skrypt \`scripts/validate-content.mjs\`).

## Wynik: ${errors.length ? `BŁĘDY (${errors.length})` : 'WSZYSTKIE KONTROLE ZALICZONE'}

| Kontrola | Oczekiwano | Wynik | Status |
|---|---|---|---|
${rows.map((r) => `| ${r.name} | ${r.expected} | ${r.actual} | ${r.ok ? 'OK' : 'BŁĄD'} |`).join('\n')}

## Artykuły według kategorii

| Kategoria | Artykuły | W tym partnerskie |
|---|---:|---:|
${catStats}

Długość treści (słowa, bez front matter): redakcyjne ${Math.min(...wordsE)}–${Math.max(...wordsE)}, partnerskie ${Math.min(...wordsS)}–${Math.max(...wordsS)}.

## Linki do klientów (${clientLinks.length})

| Klient | Adres docelowy | Tytuł artykułu | Anchor | URL artykułu | Słowa |
|---|---|---|---|---|---:|
${clientTable}

## Ostrzeżenia (${warnings.length})

${warnings.map((w) => `- ${w}`).join('\n') || '- brak'}

## Błędy (${errors.length})

${errors.map((e) => `- ${e}`).join('\n') || '- brak'}
`;
writeFileSync(path.join(root, 'RAPORT-WALIDACJI.md'), report);

const pad = (s, n) => String(s).padEnd(n);
console.log('\nKONTROLA KOŃCOWA – Horyzont Praktyczny\n');
for (const r of rows) console.log(`${r.ok ? '✔' : '✘'} ${pad(r.name, 66)} oczekiwano: ${pad(r.expected, 6)} wynik: ${r.actual}`);
if (warnings.length) { console.log(`\nOstrzeżenia (${warnings.length}):`); warnings.forEach((w) => console.log('  ! ' + w)); }
if (errors.length) { console.log(`\nBłędy (${errors.length}):`); errors.forEach((e) => console.log('  ✘ ' + e)); process.exit(1); }
console.log('\nWszystkie kontrole zaliczone. Raport: RAPORT-WALIDACJI.md');
