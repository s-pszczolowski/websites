#!/usr/bin/env node
/**
 * Kontrola końcowa portalu Puls Regionów.
 * Sprawdza pliki treści (src/content/articles), plan klientów (selected-clients.json)
 * oraz wynik kompilacji (dist/). Uruchom po `npm run build`:  node scripts/validate-content.mjs
 * Wynik: tabela w konsoli + plik RAPORT-WALIDACJI.md. Kod wyjścia 1 przy błędach.
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
const info = (name, actual) => rows.push({ name, expected: '–', actual, ok: true });
const check = (name, expected, actual, ok = String(expected) === String(actual)) => {
  rows.push({ name, expected, actual, ok });
  if (!ok) err(`${name}: oczekiwano ${expected}, jest ${actual}`);
};

// ---------- Konfiguracja portalu ----------
const portalTs = readFileSync(path.join(root, 'src/config/portal.ts'), 'utf8');
const sections = [...portalTs.matchAll(/slug: '([^']+)', label: '([^']+)', nav: '[^']+', tint:/g)].map((m) => ({ slug: m[1], name: m[2] }));
const regions = [...portalTs.matchAll(/slug: '([^']+)', label: '([^']+)', intro:/g)].map((m) => ({ slug: m[1], name: m[2] }));
const EXPECTED_PER_SECTION = {
  'szczecin-i-pomorze-zachodnie': 9, 'dom-remonty-i-nieruchomosci': 8, 'zdrowie-i-specjalisci': 7, 'lokalny-biznes-i-gospodarka': 7,
  'turystyka-i-wypoczynek': 6, 'transport-i-motoryzacja': 5, 'rodzina-i-codzienne-zycie': 4, 'technologie-i-uslugi': 4,
};
const EXPECTED_PER_MONTH = { '08': 18, '09': 16, '10': 16 };
const clientBase = readFileSync(path.join(root, 'scripts/client-base.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
const hostOf = (u) => new URL(u).hostname.replace(/^www\./, '');
const baseHosts = new Set(clientBase.map(hostOf));

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const fm = {}; const lines = m[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let [, k, v] = kv;
    if (v === '') { const items = []; while (lines[i + 1] && /^\s+/.test(lines[i + 1])) items.push(lines[++i]); fm[k] = items; continue; }
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
  const parsed = parseFrontmatter(readFileSync(path.join(contentDir, f), 'utf8'));
  if (!parsed) { err(`${slug}: brak front matter`); return null; }
  const { fm, body } = parsed;
  const words = body.replace(/<[^>]+>/g, ' ').replace(/\]\([^)]*\)/g, ']').replace(/[#>*|_`-]/g, ' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
  return { slug, fm, body, words };
}).filter(Boolean);
const bySlug = new Map(articles.map((a) => [a.slug, a]));
const editorial = articles.filter((a) => !a.fm.sponsored);
const sponsored = articles.filter((a) => a.fm.sponsored);

check('Konfiguracja portalu (src/config/portal.ts): działy', 8, sections.length);
check('Konfiguracja portalu: wydania regionalne', 4, regions.length);
check('Liczba artykułów (pliki treści)', 50, articles.length);

// Slugi
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
check('Slugi niezgodne z formatem (małe litery ASCII, myślniki)', 0, articles.filter((a) => !slugRe.test(a.slug) || /\d{4}/.test(a.slug)).length);
check('Duplikaty slugów', 0, articles.length - new Set(articles.map((a) => a.slug)).size);
const reserved = new Set(['dzial', 'najnowsze', 'region', 'o-nas', 'kontakt', 'polityka-prywatnosci', 'cookies', 'wspolpraca', 'artykuly-sponsorowane', 'mapa-serwisu', 'grafika', 'rss', '404']);
check('Kolizje slugów z podstronami systemowymi', 0, articles.filter((a) => reserved.has(a.slug)).length);

// Pola
const required = ['title', 'metaTitle', 'metaDescription', 'lead', 'section', 'region', 'genre', 'date', 'pictureAlt'];
for (const f of required) for (const a of articles) if (!a.fm[f]) err(`${a.slug}: brak pola ${f}`);
const missing = (f) => articles.filter((a) => !a.fm[f] || String(a.fm[f]).trim().length < 3).length;
check('Artykuły bez meta title', 0, missing('metaTitle'));
check('Artykuły bez meta description', 0, missing('metaDescription'));
check('Artykuły bez leadu', 0, missing('lead'));
check('Artykuły bez źródeł (sekcja „Skąd wiemy”)', 0, articles.filter((a) => !Array.isArray(a.fm.sources) || a.fm.sources.length < 2).length);
const uniq = (f) => articles.length - new Set(articles.map((a) => String(a.fm[f]).toLowerCase())).size;
check('Zduplikowane tytuły', 0, uniq('title'));
check('Zduplikowane meta title', 0, uniq('metaTitle'));
check('Zduplikowane meta description', 0, uniq('metaDescription'));
check('Zduplikowane leady', 0, uniq('lead'));
for (const a of articles) {
  if (a.fm.metaTitle.length > 68) err(`${a.slug}: meta title > 68 znaków`);
  if (a.fm.metaDescription.length < 80 || a.fm.metaDescription.length > 160) err(`${a.slug}: meta description ${a.fm.metaDescription.length} znaków`);
}

// Treść
check('Puste artykuły (< 300 słów)', 0, articles.filter((a) => a.words < 300).length);
check('Teksty zastępcze', 0, articles.filter((a) => /lorem ipsum|\bTODO\b|\bXXX\b|\[do uzupełnienia\]|tekst zastępczy/i.test(a.body)).length);
check('H1 w treści artykułu (H1 tylko w szablonie)', 0, articles.filter((a) => /^# /m.test(a.body)).length);
check('Artykuły z mniej niż 3 nagłówkami H2', 0, articles.filter((a) => (a.body.match(/^## /gm) || []).length < 3).length);
// Zakaz wymyślonych wypowiedzi, wywiadów i relacji z wydarzeń
const quoteRe = /(powiedział[a]?|mówi nam|w rozmowie z nami|zdradził[a]?|przekonuje [A-ZŁŚŻ]|tłumaczy [A-ZŁŚŻ][a-ząćęłńóśźż]+ [A-ZŁŚŻ]|podkreśla [A-ZŁŚŻ][a-ząćęłńóśźż]+ [A-ZŁŚŻ]|– mówi|— mówi|mieszka(?:niec|nka) [A-ZŁŚŻ][a-z]+ \w+ opowiada)/;
check('Przypisane osobom wypowiedzi / wywiady (zakazane)', 0, articles.filter((a) => quoteRe.test(a.body)).length);
articles.filter((a) => quoteRe.test(a.body)).forEach((a) => err(`${a.slug}: wygląda na cytat lub wypowiedź: ${a.body.match(quoteRe)[0]}`));
check('Wzmianki „według naszych ustaleń”, „dowiedzieliśmy się” (niepotwierdzone informacje)', 0, articles.filter((a) => /dowiedzieliśmy się|według naszych (ustaleń|informacji)|nieoficjalnie/i.test(a.body)).length);

const secSlugs = new Set(sections.map((c) => c.slug));
const regSlugs = new Set(regions.map((r) => r.slug));
check('Artykuły bez poprawnego działu', 0, articles.filter((a) => !secSlugs.has(a.fm.section)).length);
check('Artykuły bez poprawnego wydania regionalnego', 0, articles.filter((a) => !regSlugs.has(a.fm.region)).length);
for (const [slug, n] of Object.entries(EXPECTED_PER_SECTION)) check(`Artykuły w dziale ${slug}`, n, articles.filter((a) => a.fm.section === slug).length);
const regionCount = Object.fromEntries(regions.map((r) => [r.slug, articles.filter((a) => a.fm.region === r.slug).length]));
info('Rozkład wydań regionalnych (szczecin / pomorze-zachodnie / wybrzeze / polska)', `${regionCount.szczecin} / ${regionCount['pomorze-zachodnie']} / ${regionCount.wybrzeze} / ${regionCount.polska}`);
check('Równowaga treści regionalnych i uniwersalnych (polska: 30–60%)', 'tak', regionCount.polska >= 15 && regionCount.polska <= 30 ? 'tak' : 'nie');

// Powiązane
let badRelated = 0;
for (const a of articles) for (const r of a.fm.related || []) if (!bySlug.has(r) || r === a.slug) { badRelated++; err(`${a.slug}: powiązany artykuł „${r}” nie istnieje`); }
check('Niedziałające odwołania do powiązanych artykułów', 0, badRelated);
check('Artykuły bez 3 powiązanych artykułów', 0, articles.filter((a) => !a.fm.related || new Set(a.fm.related).size !== 3).length);

// Daty
const dates = articles.map((a) => ({ slug: a.slug, d: new Date(a.fm.date) }));
check('Daty w zakresie 1.08–31.10.2026', 50, dates.filter(({ d }) => d >= new Date('2026-08-01T00:00:00+02:00') && d <= new Date('2026-10-31T23:59:59+01:00')).length);
const warsawDay = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(d);
const byMonth = { '08': 0, '09': 0, '10': 0 };
for (const { d } of dates) byMonth[warsawDay(d).slice(5, 7)]++;
check('Artykuły w sierpniu 2026', EXPECTED_PER_MONTH['08'], byMonth['08']);
check('Artykuły we wrześniu 2026', EXPECTED_PER_MONTH['09'], byMonth['09']);
check('Artykuły w październiku 2026', EXPECTED_PER_MONTH['10'], byMonth['10']);
check('Liczba różnych dni publikacji', 50, new Set(dates.map(({ d }) => warsawDay(d))).size);
const tzBad = articles.filter((a) => { const s = String(a.fm.date); const d = new Date(s); const summer = d < new Date('2026-10-25T03:00:00+02:00'); return !s.endsWith(summer ? '+02:00' : '+01:00'); });
check('Strefa czasowa dat zgodna z czasem letnim/zimowym w Polsce', 0, tzBad.length);

// Długość
for (const a of editorial) if (a.words < 400 || a.words > 1100) warn(`${a.slug}: ${a.words} słów (orientacyjnie 400–1100)`);
for (const a of sponsored) if (a.words < 700 || a.words > 1300) warn(`${a.slug}: ${a.words} słów (orientacyjnie 700–1300)`);

// ---------- Klienci ----------
const selPath = path.join(root, 'selected-clients.json');
check('Zapisany wynik losowania (selected-clients.json)', 'tak', existsSync(selPath) ? 'tak' : 'nie');
const selJson = existsSync(selPath) ? JSON.parse(readFileSync(selPath, 'utf8')) : { selected: [] };
const selected = selJson.selected;
check('Wylosowani klienci w pliku', 10, selected.length);
check('Wylosowani klienci spoza bazy', 0, selected.filter((s) => !clientBase.includes(s.url)).length);
check('Różne firmy wśród wylosowanych', 10, new Set(selected.map((s) => s.id)).size);
check('Klienci bez opisu obszaru działania (obszar)', 0, selected.filter((s) => !s.obszar).length);

const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|<a\s[^>]*href="(https?:\/\/[^"]+)"[^>]*>([^<]*)<\/a>/g;
const clientLinks = [];
let nonClientExternal = 0;
for (const a of articles) {
  for (const m of a.body.matchAll(linkRe)) {
    const url = m[2] || m[3]; const anchor = m[1] || m[4];
    if (baseHosts.has(hostOf(url))) clientLinks.push({ slug: a.slug, url, anchor, host: hostOf(url) });
    else { nonClientExternal++; err(`${a.slug}: link zewnętrzny w treści spoza bazy klientów: ${url}`); }
  }
}
check('Artykuły redakcyjne (bez linków do klientów)', 40, articles.filter((a) => !clientLinks.some((l) => l.slug === a.slug)).length);
check('Artykuły zawierające link do klienta', 10, new Set(clientLinks.map((l) => l.slug)).size);
check('Liczba linków do klientów', 10, clientLinks.length);
check('Liczba różnych linkowanych klientów', 10, new Set(clientLinks.map((l) => l.host)).size);
check('Linki spoza bazy klientów (w treści artykułów)', 0, nonClientExternal);
const selectedUrls = new Set(selected.map((s) => s.url));
check('Linki do klientów niewylosowanych', 0, clientLinks.filter((l) => !selectedUrls.has(l.url)).length);
check('Artykuły z linkiem oznaczone jako sponsorowane', 10, clientLinks.filter((l) => bySlug.get(l.slug).fm.sponsored === true).length);
check('Artykuły sponsorowane bez linku do klienta', 0, sponsored.filter((a) => !clientLinks.some((l) => l.slug === a.slug)).length);
for (const l of clientLinks) {
  const a = bySlug.get(l.slug);
  const sel = selected.find((s) => s.url === l.url);
  if (!sel || a.fm.client !== sel.id) err(`${l.slug}: pole client (${a.fm.client}) nie odpowiada linkowi ${l.url}`);
  if (sel && sel.anchor !== l.anchor) err(`${l.slug}: anchor „${l.anchor}” różni się od planu („${sel.anchor}”)`);
  if (sel && sel.artykul !== `/${l.slug}/`) err(`${l.slug}: artykuł niezgodny z planem (${sel.artykul})`);
  if (sel && sel.kategoria !== a.fm.section) err(`${l.slug}: dział niezgodny z planem (${sel.kategoria})`);
  if (l.anchor.split(/\s+/).length > 8) warn(`${l.slug}: długi anchor „${l.anchor}”`);
  if (/kliknij|sprawdź stronę|tutaj|^https?:/i.test(l.anchor)) err(`${l.slug}: niedozwolony anchor „${l.anchor}”`);
  const paras = a.body.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !/^(#|\||>|- |\d+\. |<)/.test(p));
  const idx = paras.findIndex((p) => p.includes(l.url));
  if (idx <= 0 || idx === paras.length - 1) err(`${l.slug}: link klienta w pierwszym/ostatnim akapicie lub poza akapitem (pozycja ${idx + 1}/${paras.length})`);
}
check('Anchory i artykuły zgodne z planem (selected-clients.json)', 10, clientLinks.filter((l) => { const s = selected.find((x) => x.url === l.url); return s && s.anchor === l.anchor && s.artykul === `/${l.slug}/`; }).length);
check('Powtórzone anchory', 0, clientLinks.length - new Set(clientLinks.map((l) => l.anchor.toLowerCase())).size);

// ---------- Niezależność od wcześniejszych portali ----------
const ownCss = readFileSync(path.join(root, 'src/styles/puls.css'), 'utf8');
const ruleSet = (css) => new Set(css.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map((r) => r.replace(/\s+/g, ' ').trim()).filter((r) => r.length > 30));
const ownRules = ruleSet(ownCss);
const previous = [
  { name: 'Mapa Codzienności', dir: path.join(root, '../mapa-codziennosci'), css: ['src/styles/global.css'] },
  { name: 'Horyzont Praktyczny', dir: path.join(root, '../horyzont-praktyczny'), css: ['src/styles/site.css'] },
];
for (const p of previous) {
  const artDir = path.join(p.dir, 'src/content/articles');
  if (!existsSync(artDir)) { warn(`Brak katalogu ${p.name} – pominięto porównanie`); continue; }
  const pf = readdirSync(artDir).filter((f) => f.endsWith('.md'));
  const pSlugs = new Set(pf.map((f) => f.slice(0, -3)));
  const pTexts = pf.map((f) => readFileSync(path.join(artDir, f), 'utf8'));
  const pTitles = new Set(pTexts.map((t) => (t.match(/^title:\s*"(.*)"$/m) || [])[1]?.toLowerCase()));
  check(`Slugi powtórzone z portalu ${p.name}`, 0, articles.filter((a) => pSlugs.has(a.slug)).length);
  check(`Tytuły powtórzone z portalu ${p.name}`, 0, articles.filter((a) => pTitles.has(String(a.fm.title).toLowerCase())).length);
  // akapity skopiowane 1:1 (dłuższe niż 120 znaków)
  const pParas = new Set(pTexts.flatMap((t) => t.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length > 120)));
  check(`Akapity skopiowane 1:1 z portalu ${p.name}`, 0, articles.reduce((n, a) => n + a.body.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => pParas.has(s)).length, 0));
  const pSelPath = path.join(p.dir, 'selected-clients.json');
  const pSel = existsSync(pSelPath) ? JSON.parse(readFileSync(pSelPath, 'utf8')).selected : [];
  const pAnchors = new Set(pSel.map((s) => (s.anchor || '').toLowerCase()));
  check(`Zestaw klientów identyczny jak w portalu ${p.name}`, 'nie', pSel.length && pSel.every((s) => selected.some((x) => x.id === s.id)) ? 'tak' : 'nie');
  info(`Klienci wspólni z portalem ${p.name} (dopuszczalne, informacyjnie)`, selected.filter((s) => pSel.some((m) => m.id === s.id)).map((s) => s.id).join(', ') || '0');
  check(`Anchory powtórzone z portalu ${p.name}`, 0, clientLinks.filter((l) => pAnchors.has(l.anchor.toLowerCase())).length);
  let shared = 0;
  for (const c of p.css) { const f = path.join(p.dir, c); if (existsSync(f)) { const pr = ruleSet(readFileSync(f, 'utf8')); shared += [...ownRules].filter((r) => pr.has(r)).length; } }
  check(`Reguły CSS skopiowane 1:1 z portalu ${p.name}`, 0, shared);
}

// ---------- Kompilacja ----------
if (!existsSync(dist)) {
  err('Brak katalogu dist/ – uruchom najpierw npm run build');
} else {
  const walk = (d) => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const htmlFiles = walk(dist).filter((f) => f.endsWith('.html'));
  const urlOf = (f) => ('/' + path.relative(dist, f).replace(/\\/g, '/')).replace(/index\.html$/, '');
  const pages = htmlFiles.map((f) => ({ url: urlOf(f), html: readFileSync(f, 'utf8') }));
  const pageByUrl = new Map(pages.map((p) => [p.url, p]));
  const html = (u) => pageByUrl.get(u)?.html || '';
  const canonicalOf = (h) => (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const siteUrl = new URL(canonicalOf(html('/'))).origin;
  const isLocal = /localhost|127\.0\.0\.1/.test(siteUrl);
  if (isLocal) warn(`Kompilacja bez SITE_URL (canonical: ${siteUrl}) – wersja testowa, nie produkcyjna.`);
  info('Domena w adresach kanonicznych', siteUrl);

  check('Podstrony artykułów w kompilacji', 50, articles.filter((a) => pageByUrl.has(`/${a.slug}/`)).length);
  info('Wszystkie podstrony HTML w kompilacji', pages.length);

  const contentPages = pages.filter((p) => p.url !== '/404.html');
  const h1Bad = contentPages.filter((p) => (p.html.match(/<h1[\s>]/g) || []).length !== 1);
  check('Podstrony bez H1 lub z więcej niż jednym H1', 0, h1Bad.length);
  h1Bad.forEach((p) => err(`H1: ${p.url}`));
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
  check('Podstrony bez atrybutu lang="pl"', 0, pages.filter((p) => !/<html lang="pl"/.test(p.html)).length);

  // JSON-LD
  let ldErrors = 0; let articleLd = 0; let breadcrumbLd = 0;
  for (const p of pages) {
    for (const m of p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        const list = [JSON.parse(m[1])].flat();
        if (articles.some((a) => p.url === `/${a.slug}/`)) {
          if (list.some((x) => /^(News)?Article$/.test(x['@type']) && x.datePublished && x.dateModified && x.publisher && x.author && x.image)) articleLd++;
          if (list.some((x) => x['@type'] === 'BreadcrumbList')) breadcrumbLd++;
        }
      } catch { ldErrors++; err(`JSON-LD niepoprawny: ${p.url}`); }
    }
    if (!/"@type":"(NewsMedia)?Organization"/.test(p.html) || !/"@type":"WebSite"/.test(p.html)) err(`Brak Organization/WebSite: ${p.url}`);
  }
  check('Błędy składni JSON-LD', 0, ldErrors);
  check('Artykuły z danymi strukturalnymi NewsArticle', 50, articleLd);
  check('Artykuły z danymi BreadcrumbList', 50, breadcrumbLd);
  check('Artykuły z okruszkami (breadcrumbs)', 50, articles.filter((a) => /class="crumbs"/.test(html(`/${a.slug}/`))).length);
  check('Artykuły z sekcją źródeł', 50, articles.filter((a) => /class="where"/.test(html(`/${a.slug}/`))).length);
  check('Artykuły z widoczną datą publikacji (<time>)', 50, articles.filter((a) => /<time datetime="2026-/.test(html(`/${a.slug}/`))).length);

  // Linki wewnętrzne i kotwice
  const resolveInternal = (href) => {
    let u = href; if (u.startsWith(siteUrl)) u = u.slice(siteUrl.length) || '/';
    const clean = decodeURIComponent(u.split('#')[0].split('?')[0]);
    const target = path.join(dist, clean);
    return clean.endsWith('/') ? existsSync(path.join(target, 'index.html')) : existsSync(target);
  };
  let broken = 0; let internal = 0; let badAnchors = 0;
  for (const p of pages) {
    for (const m of p.html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
      const href = m[1].replace(/&amp;/g, '&');
      if (href.startsWith('/') || href.startsWith(siteUrl)) {
        internal++;
        if (!resolveInternal(href)) { broken++; err(`Niedziałający link wewnętrzny: ${p.url} -> ${href}`); }
        else if (href.includes('#')) {
          const [tp, id] = href.split('#'); const tgt = tp ? pageByUrl.get(tp.replace(siteUrl, '')) : p;
          if (tgt && !tgt.html.includes(`id="${id}"`)) { badAnchors++; err(`Kotwica #${id} nie istnieje: ${p.url} -> ${href}`); }
        }
      } else if (href.startsWith('#') && href.length > 1 && !p.html.includes(`id="${href.slice(1)}"`)) { badAnchors++; err(`Kotwica ${href} nie istnieje na ${p.url}`); }
    }
  }
  check('Niedziałające linki wewnętrzne', 0, broken);
  check('Niedziałające kotwice', 0, badAnchors);
  info('Sprawdzone linki wewnętrzne (łącznie)', internal);

  // Obrazy
  let imgMissing = 0; let imgNoAlt = 0; let imgs = 0; let lazy = 0; let noSize = 0;
  for (const p of pages) {
    for (const m of p.html.matchAll(/<img\s([^>]*)>/g)) {
      imgs++; const attrs = m[1]; const src = (attrs.match(/src="([^"]+)"/) || [])[1];
      if (!/(^|\s)alt="/.test(attrs)) imgNoAlt++;
      if (/loading="lazy"/.test(attrs)) lazy++;
      if (!/width="\d+"/.test(attrs) || !/height="\d+"/.test(attrs)) noSize++;
      if (src && src.startsWith('/') && !existsSync(path.join(dist, src))) { imgMissing++; err(`Brak obrazu ${src} na ${p.url}`); }
    }
  }
  check('Obrazy bez atrybutu alt', 0, imgNoAlt);
  check('Obrazy bez wymiarów (width/height – stabilny układ)', 0, noSize);
  check('Niedziałające adresy obrazów', 0, imgMissing);
  info('Obrazy z lazy loading / wszystkie obrazy', `${lazy} / ${imgs}`);
  check('Artykuły z ilustracją i opisem ALT', 50, articles.filter((a) => /class="article__figure"[\s\S]*?<img[^>]+alt="[^"]{10,}"/.test(html(`/${a.slug}/`))).length);
  check('Brakujące grafiki Open Graph artykułów', 0, articles.filter((a) => !existsSync(path.join(dist, 'grafika/udostepnianie', `${a.slug}.jpg`))).length);
  check('Brakujące ilustracje SVG artykułów', 0, articles.filter((a) => !existsSync(path.join(dist, 'grafika', `${a.slug}.svg`))).length);

  // Linki do klientów w HTML
  const htmlClient = [];
  for (const p of pages) for (const m of p.html.matchAll(/<a\s([^>]*)>/g)) {
    const href = (m[1].match(/href="([^"]+)"/) || [])[1] || '';
    if (/^https?:/.test(href) && baseHosts.has(hostOf(href))) htmlClient.push({ url: p.url, href, rel: (m[1].match(/rel="([^"]+)"/) || [])[1] || '' });
  }
  check('Linki do klientów w całym serwisie (HTML)', 10, htmlClient.length);
  check('Linki do klientów poza 10 artykułami sponsorowanymi', 0, htmlClient.filter((l) => !sponsored.some((a) => l.url === `/${a.slug}/`)).length);
  check('Linki do klientów bez rel="sponsored"', 0, htmlClient.filter((l) => !/\bsponsored\b/.test(l.rel)).length);
  check('Artykuły sponsorowane z oznaczeniem „Artykuł sponsorowany”', 10, sponsored.filter((a) => /Artykuł sponsorowany/.test(html(`/${a.slug}/`))).length);
  check('Artykuły redakcyjne błędnie oznaczone jako sponsorowane', 0, editorial.filter((a) => /Artykuł sponsorowany/.test(html(`/${a.slug}/`))).length);
  check('Strona „Artykuły sponsorowane” linkuje do wszystkich 10', 10, sponsored.filter((a) => html('/artykuly-sponsorowane/').includes(`href="/${a.slug}/"`)).length);
  const chrome = pages.map((p) => [/<header class="mast"[\s\S]*?<\/header>/, /<footer class="foot"[\s\S]*?<\/footer>/, /<aside class="picks"[\s\S]*?<\/aside>/, /<aside class="article__side"[\s\S]*?<\/aside>/, /<nav class="newsbar"[\s\S]*?<\/nav>/].map((re) => (p.html.match(re) || [''])[0]).join('')).join('');
  check('Linki do klientów w nagłówku/stopce/menu/sidebarach', 0, [...baseHosts].filter((h) => chrome.includes(h)).length);

  // Układ strony głównej
  const front = (html('/').match(/<section class="frame front"[\s\S]*?<\/section>/) || [''])[0];
  check('Sekcja wiodąca: duży artykuł + mniejsze (różne publikacje)', 3, new Set([...front.matchAll(/<h2 class="story__title"><a href="([^"]+)"/g)].map((m) => m[1])).size);
  check('Strona główna: bloki regionalne z własnymi nagłówkami', 'tak', (html('/').match(/class="region-head/g) || []).length >= 6 ? 'tak' : 'nie');
  check('Strona główna: sekcja „Poradniki dla mieszkańców”', 'tak', /Poradniki dla mieszkańców/.test(html('/')) ? 'tak' : 'nie');
  check('Strona główna: sidebar „Polecane przez redakcję”', 'tak', /<aside class="picks"[\s\S]*?Polecane przez redakcję/.test(html('/')) ? 'tak' : 'nie');
  check('Strona główna wyświetla mniej niż 50 publikacji', 'tak', new Set([...html('/').matchAll(/class="story__title"><a href="([^"]+)"/g)].map((m) => m[1])).size < 50 ? 'tak' : 'nie');
  check('Działy z sidebarem „Polecane przez redakcję”', sections.length, sections.filter((c) => /Polecane przez redakcję/.test(html(`/dzial/${c.slug}/`))).length);
  check('Menu działów (mobile) z przełącznikiem', 'tak', /class="newsbar__toggle"/.test(html('/')) && /class="newsbar__button"/.test(html('/')) ? 'tak' : 'nie');

  // Archiwa
  const sortedSlugs = [...articles].sort((a, b) => new Date(b.fm.date) - new Date(a.fm.date)).map((a) => `/${a.slug}/`);
  const listPages = Math.ceil(50 / 10);
  check('Strony paginacji „Najnowsze”', listPages, ['/najnowsze/', ...Array.from({ length: listPages - 1 }, (_, i) => `/najnowsze/${i + 2}/`)].filter((u) => pageByUrl.has(u)).length);
  const listed = ['/najnowsze/', ...Array.from({ length: listPages - 1 }, (_, i) => `/najnowsze/${i + 2}/`)].flatMap((u) => [...html(u).matchAll(/class="story__title"><a href="([^"]+)"/g)].map((m) => m[1]));
  check('„Najnowsze”: wszystkie 50 publikacji od najnowszych', 'tak', JSON.stringify(listed) === JSON.stringify(sortedSlugs) ? 'tak' : 'nie');
  check('Paginacja z rel="prev"/rel="next"', 'tak', /rel="next"/.test(html('/najnowsze/')) && /rel="prev"/.test(html(`/najnowsze/${listPages}/`)) ? 'tak' : 'nie');
  check('Archiwa miesięczne (2026/08, 09, 10)', 3, ['08', '09', '10'].filter((m) => pageByUrl.has(`/najnowsze/2026/${m}/`)).length);
  for (const m of ['08', '09', '10']) {
    const n = new Set([...html(`/najnowsze/2026/${m}/`).matchAll(/class="story__title"><a href="([^"]+)"/g)].map((x) => x[1])).size;
    if (n !== EXPECTED_PER_MONTH[m]) err(`Archiwum 2026/${m}: ${n} publikacji zamiast ${EXPECTED_PER_MONTH[m]}`);
  }
  const fullSection = (c) => { const ps = pages.filter((p) => p.url.startsWith(`/dzial/${c.slug}/`)); return articles.filter((a) => a.fm.section === c.slug).every((a) => ps.some((p) => p.html.includes(`href="/${a.slug}/"`))); };
  check('Archiwa działów linkujące do wszystkich swoich artykułów', sections.length, sections.filter(fullSection).length);
  check('Strony wydań regionalnych linkujące do wszystkich swoich artykułów', regions.length, regions.filter((r) => articles.filter((a) => a.fm.region === r.slug).every((a) => html(`/region/${r.slug}/`).includes(`href="/${a.slug}/"`))).length);
  check('Mapa serwisu linkuje do wszystkich artykułów', 50, articles.filter((a) => html('/mapa-serwisu/').includes(`href="/${a.slug}/"`)).length);
  check('Strona 404', 'tak', pageByUrl.has('/404.html') ? 'tak' : 'nie');

  // Strony informacyjne
  for (const u of ['/o-nas/', '/kontakt/', '/wspolpraca/', '/artykuly-sponsorowane/', '/polityka-prywatnosci/', '/cookies/']) if (!pageByUrl.has(u)) err(`Brak strony informacyjnej ${u}`);
  check('Strony informacyjne', 6, ['/o-nas/', '/kontakt/', '/wspolpraca/', '/artykuly-sponsorowane/', '/polityka-prywatnosci/', '/cookies/'].filter((u) => pageByUrl.has(u)).length);
  const deploy = JSON.parse(readFileSync(path.join(root, 'deployment.config.json'), 'utf8'));
  const ownerFilled = Boolean(deploy.wydawca?.nazwa && deploy.wydawca?.adres && deploy.redakcja?.email);
  info('Dane właściciela uzupełnione (deployment.config.json)', ownerFilled ? 'tak' : 'nie – strony prawne noindex');
  if (!ownerFilled) check('Strony prawne z noindex przy brakujących danych właściciela', 2, ['/polityka-prywatnosci/', '/cookies/'].filter((u) => /name="robots" content="noindex/.test(html(u))).length);
  check('Wymyślone dane właściciela (NIP/KRS/REGON) w HTML', 0, pages.filter((p) => /NIP:?\s*\d{3}-?\d{3}-?\d{2}-?\d{2}|KRS:?\s*\d{10}|REGON:?\s*\d{9}/.test(p.html)).length);

  // Sitemap, robots, RSS
  const smPath = path.join(dist, 'sitemap.xml');
  if (!existsSync(smPath)) err('Brak sitemap.xml');
  else {
    const locs = [...readFileSync(smPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    check('Adresy w sitemap.xml spoza domeny', 0, locs.filter((l) => !l.startsWith(siteUrl + '/')).length);
    check('Duplikaty w sitemap.xml', 0, locs.length - new Set(locs).size);
    check('Adresy w sitemap.xml bez odpowiadającej podstrony', 0, locs.filter((l) => !resolveInternal(l)).length);
    check('Artykuły obecne w sitemap.xml', 50, articles.filter((a) => locs.includes(`${siteUrl}/${a.slug}/`)).length);
    check('Strony noindex w sitemap.xml', 0, locs.filter((l) => /name="robots" content="noindex/.test(html(l.slice(siteUrl.length)))).length);
    info('Adresy w sitemap.xml (łącznie)', locs.length);
  }
  const robots = existsSync(path.join(dist, 'robots.txt')) ? readFileSync(path.join(dist, 'robots.txt'), 'utf8') : '';
  check('robots.txt zgodny z trybem kompilacji', 'tak', isLocal ? (/Disallow: \//.test(robots) ? 'tak' : 'nie') : (robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`) && !/Disallow: \/\s*$/m.test(robots) ? 'tak' : 'nie'));
  check('Adresy localhost w kompilacji produkcyjnej', 0, isLocal ? 0 : pages.filter((p) => /localhost:4321/.test(p.html)).length);
  const rss = existsSync(path.join(dist, 'rss.xml')) ? readFileSync(path.join(dist, 'rss.xml'), 'utf8') : '';
  check('Kanał RSS z publikacjami', 'tak', (rss.match(/<item>/g) || []).length >= 20 ? 'tak' : 'nie');
}

// ---------- Raport ----------
const secStats = sections.map((c) => `| ${c.name} | ${articles.filter((a) => a.fm.section === c.slug).length} | ${articles.filter((a) => a.fm.section === c.slug && a.fm.sponsored).length} |`).join('\n');
const monthStats = Object.entries(byMonth).map(([m, n]) => `| 2026-${m} | ${n} | ${EXPECTED_PER_MONTH[m]} |`).join('\n');
const wordsE = editorial.map((a) => a.words); const wordsS = sponsored.map((a) => a.words);
const site = (() => { try { return new URL((readFileSync(path.join(dist, 'index.html'), 'utf8').match(/<link rel="canonical" href="([^"]+)"/) || [])[1]).origin; } catch { return ''; } })();
const clientTable = clientLinks.map((l) => { const a = bySlug.get(l.slug); const s = selected.find((x) => x.url === l.url) || {}; return `| ${s.nazwa || a.fm.client} | ${l.url} | ${a.fm.title} | „${l.anchor}” | ${site}/${l.slug}/ | ${a.words} |`; }).join('\n');
const report = `# Raport walidacji – Puls Regionów

Wygenerowano: ${new Date().toISOString()} (skrypt \`scripts/validate-content.mjs\`).

## Wynik: ${errors.length ? `BŁĘDY (${errors.length})` : 'WSZYSTKIE KONTROLE ZALICZONE'}

| Kontrola | Oczekiwano | Wynik | Status |
|---|---|---|---|
${rows.map((r) => `| ${r.name} | ${r.expected} | ${r.actual} | ${r.ok ? 'OK' : 'BŁĄD'} |`).join('\n')}

## Artykuły według działów

| Dział | Artykuły | W tym sponsorowane |
|---|---:|---:|
${secStats}

## Daty publikacji (dane demonstracyjne)

| Miesiąc | Artykuły | Plan |
|---|---:|---:|
${monthStats}

Długość treści (słowa, bez front matter): redakcyjne ${Math.min(...wordsE)}–${Math.max(...wordsE)}, sponsorowane ${Math.min(...wordsS)}–${Math.max(...wordsS)}.

## Linki do klientów (${clientLinks.length})

| Klient | Adres docelowy | Tytuł artykułu | Anchor | Adres artykułu | Słowa |
|---|---|---|---|---|---:|
${clientTable}

## Ostrzeżenia (${warnings.length})

${warnings.map((w) => `- ${w}`).join('\n') || '- brak'}

## Błędy (${errors.length})

${errors.map((e) => `- ${e}`).join('\n') || '- brak'}
`;
writeFileSync(path.join(root, 'RAPORT-WALIDACJI.md'), report);

const pad = (s, n) => String(s).padEnd(n);
console.log('\nKONTROLA KOŃCOWA – Puls Regionów\n');
for (const r of rows) console.log(`${r.ok ? '✔' : '✘'} ${pad(r.name, 72)} oczekiwano: ${pad(r.expected, 6)} wynik: ${r.actual}`);
if (warnings.length) { console.log(`\nOstrzeżenia (${warnings.length}):`); warnings.forEach((w) => console.log('  ! ' + w)); }
if (errors.length) { console.log(`\nBłędy (${errors.length}):`); errors.forEach((e) => console.log('  ✘ ' + e)); process.exit(1); }
console.log('\nWszystkie kontrole zaliczone. Raport: RAPORT-WALIDACJI.md');
