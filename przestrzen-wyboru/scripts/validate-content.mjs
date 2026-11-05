#!/usr/bin/env node
/**
 * Kontrola końcowa magazynu Przestrzeń Wyboru.
 * Sprawdza pliki treści (src/content/teksty), plan klientów (selected-clients.json),
 * niezależność od wcześniejszych portali oraz wynik kompilacji (dist/).
 * Uruchom po `npm run build`:  node scripts/validate-content.mjs
 * Wynik: tabela w konsoli + RAPORT-WALIDACJI.md. Kod wyjścia 1 przy błędach.
 */
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'src/content/teksty');
const dist = path.join(root, 'dist');
const errors = []; const warnings = []; const rows = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const info = (name, actual) => rows.push({ name, expected: '–', actual, ok: true });
const check = (name, expected, actual, ok = String(expected) === String(actual)) => { rows.push({ name, expected, actual, ok }); if (!ok) err(`${name}: oczekiwano ${expected}, jest ${actual}`); };

// ---------- Konfiguracja ----------
const cfgTs = readFileSync(path.join(root, 'src/config/magazine.ts'), 'utf8');
const rubrics = [...cfgTs.matchAll(/slug: '([^']+)', title: '([^']+)'/g)].map((m) => ({ slug: m[1], name: m[2] }));
const perPage = Number((cfgTs.match(/perPage: (\d+)/) || [])[1]);
const archivePerPage = Number((cfgTs.match(/archivePerPage: (\d+)/) || [])[1]);
const EXPECTED = {
  'zdrowie-i-dobre-samopoczucie': 9, 'psychologia-i-relacje': 7, 'dom-i-wnetrza': 8, 'uroda-i-pielegnacja': 5,
  'podroze-i-odpoczynek': 6, 'rodzina-i-wychowanie': 5, 'rozwoj-osobisty-i-kariera': 5, 'swiadome-zakupy-i-uslugi': 5,
};
const MONTHS = { '08': 16, '09': 18, '10': 16 };
const clientBase = readFileSync(path.join(root, 'scripts/client-base.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
const hostOf = (u) => new URL(u).hostname.replace(/^www\./, '');
const baseHosts = new Set(clientBase.map(hostOf));

const files = readdirSync(contentDir).filter((f) => f.endsWith('.md')).sort();
const articles = files.map((f) => {
  const slug = f.slice(0, -3);
  const src = readFileSync(path.join(contentDir, f), 'utf8');
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) { err(`${slug}: brak front matter`); return null; }
  const fm = yaml.load(m[1], { schema: yaml.JSON_SCHEMA });
  const body = m[2];
  const words = body.replace(/<[^>]+>/g, ' ').replace(/\]\([^)]*\)/g, ']').replace(/[#>*|_`-]/g, ' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
  return { slug, fm, body, words, published: new Date(fm.published) };
}).filter(Boolean);
const bySlug = new Map(articles.map((a) => [a.slug, a]));
const editorial = articles.filter((a) => !a.fm.sponsored);
const sponsored = articles.filter((a) => a.fm.sponsored);

check('Rubryki w konfiguracji (src/config/magazine.ts)', 8, rubrics.length);
check('Liczba artykułów (pliki treści)', 50, articles.length);
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
check('Slugi niezgodne z formatem (małe litery ASCII, myślniki, bez dat)', 0, articles.filter((a) => !slugRe.test(a.slug) || /\d{4}/.test(a.slug) || /^(blog|artykul)-/.test(a.slug)).length);
check('Duplikaty slugów', 0, articles.length - new Set(articles.map((a) => a.slug)).size);
const reserved = new Set(['rubryka', 'wszystkie-teksty', 'o-magazynie', 'zasady-publikacji', 'materialy-partnerskie', 'kontakt', 'prywatnosc', 'pliki-cookies', 'spis-tresci', 'obrazy', 'rss', '404']);
check('Kolizje slugów z podstronami systemowymi', 0, articles.filter((a) => reserved.has(a.slug)).length);

// Pola
for (const a of articles) for (const f of ['title', 'standfirst', 'rubric', 'format', 'published', 'visualAlt']) if (!a.fm[f]) err(`${a.slug}: brak pola ${f}`);
check('Artykuły bez meta title', 0, articles.filter((a) => !a.fm.seo?.title).length);
check('Artykuły bez meta description', 0, articles.filter((a) => !a.fm.seo?.description).length);
check('Artykuły bez leadu (standfirst)', 0, articles.filter((a) => !a.fm.standfirst || a.fm.standfirst.length < 120).length);
check('Artykuły z mniej niż 2 źródłami', 0, articles.filter((a) => !Array.isArray(a.fm.sources) || a.fm.sources.length < 2).length);
const dup = (get) => articles.length - new Set(articles.map((a) => String(get(a)).toLowerCase())).size;
check('Zduplikowane tytuły', 0, dup((a) => a.fm.title));
check('Zduplikowane meta title', 0, dup((a) => a.fm.seo.title));
check('Zduplikowane meta description', 0, dup((a) => a.fm.seo.description));
check('Zduplikowane leady', 0, dup((a) => a.fm.standfirst));
check('Zduplikowane opisy ALT ilustracji', 0, dup((a) => a.fm.visualAlt));
for (const a of articles) {
  if (a.fm.seo.title.length > 66) err(`${a.slug}: meta title > 66 znaków`);
  if (a.fm.seo.description.length < 90 || a.fm.seo.description.length > 158) err(`${a.slug}: meta description ${a.fm.seo.description.length} znaków`);
}

// Treść
check('Puste lub zbyt krótkie artykuły (< 380 słów treści)', 0, articles.filter((a) => a.words < 380).length);
check('Teksty zastępcze', 0, articles.filter((a) => /lorem ipsum|\bTODO\b|\bXXX\b|\[do uzupełnienia\]|tekst zastępczy/i.test(a.body)).length);
check('H1 w treści artykułu (H1 tylko w szablonie)', 0, articles.filter((a) => /^# /m.test(a.body)).length);
check('Artykuły z mniej niż 4 nagłówkami H2', 0, articles.filter((a) => (a.body.match(/^## /gm) || []).length < 4).length);
const paras = new Map();
for (const a of articles) for (const p of a.body.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length > 120)) { if (paras.has(p) && paras.get(p) !== a.slug) err(`Powtórzony akapit: ${a.slug} i ${paras.get(p)}`); paras.set(p, a.slug); }
check('Akapity powtórzone między artykułami', 0, errors.filter((e) => e.startsWith('Powtórzony akapit')).length);
// Fałszywe historie, cytaty, „doświadczenia redakcji”
const fakeRe = /((?<!\p{L})powiedział[a]?(?!\p{L})|– mówi|— mówi|w rozmowie z nami|nasza czytelniczka|nasz czytelnik|przetestowaliśmy|testowałam|testowałem|sprawdziłam na sobie|sprawdziłem na sobie|moja przyjaciółka|mój znajomy|klientka opowiada|klient opowiada|jak mówi ekspert|według naszych ustaleń)/iu;
const fakes = articles.filter((a) => fakeRe.test(a.body));
fakes.forEach((a) => err(`${a.slug}: możliwa wymyślona wypowiedź lub historia: „${a.body.match(fakeRe)[0]}”`));
check('Wymyślone wypowiedzi, opinie klientów, „doświadczenia redaktorów”', 0, fakes.length);
const clickbait = /(nie uwierzysz|szok|zrobisz to od razu|lekarze nienawidzą|ten jeden trik|musisz to zobaczyć)/i;
check('Tytuły typu clickbait', 0, articles.filter((a) => clickbait.test(a.fm.title)).length);
const promise = /(gwarantujemy|100% skuteczn|gwarancja efektu|natychmiastowy efekt|cudown)/i;
check('Obietnice skuteczności w artykułach', 0, articles.filter((a) => promise.test(a.body)).length);

const rubricSet = new Set(rubrics.map((r) => r.slug));
check('Artykuły bez poprawnej rubryki', 0, articles.filter((a) => !rubricSet.has(a.fm.rubric)).length);
for (const [slug, n] of Object.entries(EXPECTED)) check(`Artykuły w rubryce ${slug}`, n, articles.filter((a) => a.fm.rubric === slug).length);
let badRel = 0;
for (const a of articles) for (const r of a.fm.related || []) if (!bySlug.has(r) || r === a.slug) { badRel++; err(`${a.slug}: powiązany tekst „${r}” nie istnieje`); }
check('Niedziałające odwołania do powiązanych tekstów', 0, badRel);
check('Artykuły z mniej niż 3 powiązanymi tekstami', 0, articles.filter((a) => new Set(a.fm.related || []).size < 3).length);
check('Wyróżnienie na okładce (hero)', 1, articles.filter((a) => a.fm.hero).length);
check('Temat tygodnia (wybór redakcji)', 1, articles.filter((a) => a.fm.weekTopic).length);
check('Teksty w sekcji „Warto przeczytać”', 6, articles.filter((a) => a.fm.worthReading).length);

// Daty
const warsaw = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(d);
check('Daty w zakresie 1.08–31.10.2026', 50, articles.filter((a) => a.published >= new Date('2026-08-01T00:00:00+02:00') && a.published <= new Date('2026-10-31T23:59:59+01:00')).length);
const byMonth = { '08': 0, '09': 0, '10': 0 };
for (const a of articles) byMonth[warsaw(a.published).slice(5, 7)]++;
for (const [m, n] of Object.entries(MONTHS)) check(`Artykuły w miesiącu 2026-${m}`, n, byMonth[m]);
check('Liczba różnych dni publikacji', 50, new Set(articles.map((a) => warsaw(a.published))).size);
check('Przesunięcie strefy czasowej zgodne z czasem letnim/zimowym', 0, articles.filter((a) => { const s = readFileSync(path.join(contentDir, a.slug + '.md'), 'utf8').match(/^published: (\S+)$/m)[1]; return !s.endsWith(a.published < new Date('2026-10-25T01:00:00Z') ? '+02:00' : '+01:00'); }).length);

// Długość
for (const a of editorial) if (a.words < 400 || a.words > 1300) warn(`${a.slug}: ${a.words} słów (orientacyjnie 400–1300)`);
for (const a of sponsored) if (a.words < 700 || a.words > 1400) warn(`${a.slug}: ${a.words} słów (orientacyjnie 700–1400)`);

// ---------- Klienci ----------
const selPath = path.join(root, 'selected-clients.json');
check('Zapisany wynik losowania (selected-clients.json)', 'tak', existsSync(selPath) ? 'tak' : 'nie');
const sel = existsSync(selPath) ? JSON.parse(readFileSync(selPath, 'utf8')) : { selected: [] };
const selected = sel.selected;
check('Wylosowani klienci', 10, selected.length);
check('Różne firmy wśród wylosowanych', 10, new Set(selected.map((s) => s.id)).size);
check('Adresy docelowe spoza bazy 72 adresów', 0, selected.filter((s) => !clientBase.includes(s.url)).length);
check('Baza użyta do losowania (adresy / firmy)', '72 / 70', `${sel.baseAddresses} / ${sel.baseCompanies}`);
check('Klienci bez planu (artykuł, anchor, branża, obszar)', 0, selected.filter((s) => !s.artykul || !s.anchor || !s.branza || !s.obszar).length);

const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|<a\s[^>]*href="(https?:\/\/[^"]+)"[^>]*>([^<]*)<\/a>/g;
const clientLinks = []; let foreign = 0;
for (const a of articles) for (const m of a.body.matchAll(linkRe)) {
  const url = m[2] || m[3]; const anchor = m[1] || m[4];
  if (baseHosts.has(hostOf(url))) clientLinks.push({ slug: a.slug, url, anchor });
  else { foreign++; err(`${a.slug}: link zewnętrzny w treści spoza bazy klientów: ${url}`); }
}
check('Artykuły bez linków do klientów (redakcyjne)', 40, articles.filter((a) => !clientLinks.some((l) => l.slug === a.slug)).length);
check('Artykuły z linkiem do klienta', 10, new Set(clientLinks.map((l) => l.slug)).size);
check('Linki do klientów w treści (łącznie)', 10, clientLinks.length);
check('Różni linkowani klienci', 10, new Set(clientLinks.map((l) => hostOf(l.url))).size);
check('Inne linki zewnętrzne w treści artykułów', 0, foreign);
check('Linki do klientów niewylosowanych', 0, clientLinks.filter((l) => !selected.some((s) => s.url === l.url)).length);
check('Artykuły z linkiem oznaczone jako sponsorowane', 10, clientLinks.filter((l) => bySlug.get(l.slug).fm.sponsored).length);
check('Artykuły sponsorowane bez linku', 0, sponsored.filter((a) => !clientLinks.some((l) => l.slug === a.slug)).length);
for (const l of clientLinks) {
  const a = bySlug.get(l.slug); const s = selected.find((x) => x.url === l.url);
  if (!s || a.fm.partner !== s.id) err(`${l.slug}: pole partner (${a.fm.partner}) nie odpowiada klientowi`);
  if (s && s.anchor !== l.anchor) err(`${l.slug}: anchor „${l.anchor}” ≠ plan „${s.anchor}”`);
  if (s && s.artykul !== `/${l.slug}/`) err(`${l.slug}: artykuł niezgodny z planem (${s.artykul})`);
  if (s && s.kategoria !== a.fm.rubric) err(`${l.slug}: rubryka niezgodna z planem (${s.kategoria})`);
  if (/kliknij|tutaj|sprawdź stronę|^https?:/i.test(l.anchor)) err(`${l.slug}: nienaturalny anchor „${l.anchor}”`);
  const ps = a.body.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !/^(#|\||>|- |\d+\. |<)/.test(p));
  const i = ps.findIndex((p) => p.includes(l.url));
  if (i <= 0 || i === ps.length - 1) err(`${l.slug}: link nie w środkowym akapicie (pozycja ${i + 1}/${ps.length})`);
}
check('Anchory i artykuły zgodne z planem', 10, clientLinks.filter((l) => { const s = selected.find((x) => x.url === l.url); return s && s.anchor === l.anchor && s.artykul === `/${l.slug}/`; }).length);
check('Powtórzone anchory', 0, clientLinks.length - new Set(clientLinks.map((l) => l.anchor.toLowerCase())).size);

// ---------- Niezależność od poprzednich portali ----------
const ownCss = readFileSync(path.join(root, 'src/styles/magazyn.css'), 'utf8');
const ruleSet = (css) => new Set(css.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map((r) => r.replace(/\s+/g, ' ').trim()).filter((r) => r.length > 30));
const own = ruleSet(ownCss);
const previous = [
  { name: 'Mapa Codzienności', dir: '../mapa-codziennosci', content: 'src/content/articles', css: ['src/styles/global.css'] },
  { name: 'Horyzont Praktyczny', dir: '../horyzont-praktyczny', content: 'src/content/articles', css: ['src/styles/site.css'] },
  { name: 'Puls Regionów', dir: '../puls-regionow', content: 'src/content/articles', css: ['src/styles/puls.css'] },
];
const prevIds = [];
for (const p of previous) {
  const dir = path.join(root, p.dir); const cdir = path.join(dir, p.content);
  if (!existsSync(cdir)) { warn(`Brak portalu ${p.name} – pominięto porównanie`); continue; }
  const pf = readdirSync(cdir).filter((f) => f.endsWith('.md'));
  const texts = pf.map((f) => readFileSync(path.join(cdir, f), 'utf8'));
  const slugs = new Set(pf.map((f) => f.slice(0, -3)));
  const titles = new Set(texts.map((t) => (t.match(/^title:\s*"(.*)"$/m) || [])[1]?.toLowerCase()));
  const pp = new Set(texts.flatMap((t) => t.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length > 120)));
  check(`Slugi powtórzone z portalu ${p.name}`, 0, articles.filter((a) => slugs.has(a.slug)).length);
  check(`Tytuły powtórzone z portalu ${p.name}`, 0, articles.filter((a) => titles.has(a.fm.title.toLowerCase())).length);
  check(`Akapity skopiowane z portalu ${p.name}`, 0, articles.reduce((n, a) => n + a.body.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => pp.has(s)).length, 0));
  const ps = existsSync(path.join(dir, 'selected-clients.json')) ? JSON.parse(readFileSync(path.join(dir, 'selected-clients.json'), 'utf8')).selected : [];
  prevIds.push(ps.map((s) => s.id));
  check(`Zestaw klientów identyczny jak w portalu ${p.name}`, 'nie', ps.length && ps.every((s) => selected.some((x) => x.id === s.id)) ? 'tak' : 'nie');
  info(`Klienci wspólni z portalem ${p.name} (dopuszczalne – niezależne losowanie)`, selected.filter((s) => ps.some((x) => x.id === s.id)).map((s) => s.id).join(', ') || 'brak');
  const pa = new Set(ps.map((s) => (s.anchor || '').toLowerCase()));
  check(`Anchory powtórzone z portalu ${p.name}`, 0, clientLinks.filter((l) => pa.has(l.anchor.toLowerCase())).length);
  const pArticles = new Set(ps.map((s) => s.artykul));
  check(`Adresy artykułów klientów powtórzone z portalu ${p.name}`, 0, selected.filter((s) => pArticles.has(s.artykul)).length);
  let shared = 0; for (const c of p.css) { const f = path.join(dir, c); if (existsSync(f)) { const r = ruleSet(readFileSync(f, 'utf8')); shared += [...own].filter((x) => r.has(x)).length; } }
  check(`Reguły CSS skopiowane 1:1 z portalu ${p.name}`, 0, shared);
}

// ---------- Kompilacja ----------
if (!existsSync(dist)) err('Brak katalogu dist/ – uruchom npm run build');
else {
  const walk = (d) => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const all = walk(dist);
  const pages = all.filter((f) => f.endsWith('.html')).map((f) => ({ url: ('/' + path.relative(dist, f).replace(/\\/g, '/')).replace(/index\.html$/, ''), html: readFileSync(f, 'utf8') }));
  const byUrl = new Map(pages.map((p) => [p.url, p]));
  const html = (u) => byUrl.get(u)?.html || '';
  const canon = (h) => (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const site = new URL(canon(html('/'))).origin;
  const local = /localhost|127\.0\.0\.1/.test(site);
  if (local) warn(`Kompilacja bez SITE_URL (${site}) – wersja testowa.`);
  info('Domena w adresach kanonicznych', site);
  check('Podstrony artykułów w kompilacji', 50, articles.filter((a) => byUrl.has(`/${a.slug}/`)).length);
  info('Wszystkie podstrony HTML', pages.length);
  const content = pages.filter((p) => p.url !== '/404.html');
  const h1 = content.filter((p) => (p.html.match(/<h1[\s>]/g) || []).length !== 1); h1.forEach((p) => err(`H1: ${p.url}`));
  check('Podstrony bez H1 lub z kilkoma H1', 0, h1.length);
  const titles = content.map((p) => (p.html.match(/<title>([^<]*)<\/title>/) || [])[1]);
  const descs = content.map((p) => (p.html.match(/<meta name="description" content="([^"]*)"/) || [])[1]);
  check('Podstrony bez <title>', 0, titles.filter((t) => !t).length);
  check('Podstrony bez meta description', 0, descs.filter((d) => !d).length);
  check('Zduplikowane <title>', 0, titles.length - new Set(titles).size);
  check('Zduplikowane meta description', 0, descs.length - new Set(descs).size);
  check('Canonical niezgodny z adresem podstrony', 0, content.filter((p) => canon(p.html) !== site + p.url).length);
  check('Podstrony bez viewport / lang="pl"', 0, pages.filter((p) => !/name="viewport"/.test(p.html) || !/<html lang="pl"/.test(p.html)).length);
  check('Podstrony bez Open Graph i Twitter Card', 0, content.filter((p) => !/property="og:title"/.test(p.html) || !/property="og:image"/.test(p.html) || !/name="twitter:card"/.test(p.html)).length);
  check('Artykuły z og:type=article i datami publikacji', 50, articles.filter((a) => /property="og:type" content="article"/.test(html(`/${a.slug}/`)) && /article:published_time/.test(html(`/${a.slug}/`))).length);

  let ldErr = 0; let artLd = 0; let crumbLd = 0;
  for (const p of pages) {
    for (const m of p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        const list = [JSON.parse(m[1])].flat();
        if (articles.some((a) => p.url === `/${a.slug}/`)) {
          if (list.some((x) => x['@type'] === 'Article' && x.datePublished && x.dateModified && x.author && x.publisher && x.image && x.headline)) artLd++;
          if (list.some((x) => x['@type'] === 'BreadcrumbList')) crumbLd++;
        }
      } catch { ldErr++; err(`JSON-LD niepoprawny: ${p.url}`); }
    }
    if (!/"@type":"Organization"/.test(p.html) || !/"@type":"WebSite"/.test(p.html)) err(`Brak Organization/WebSite: ${p.url}`);
  }
  check('Błędy składni JSON-LD', 0, ldErr);
  check('Artykuły z danymi Article (daty, autor, wydawca, obraz)', 50, artLd);
  check('Artykuły z BreadcrumbList', 50, crumbLd);
  check('Artykuły z widocznymi okruszkami', 50, articles.filter((a) => /class="trail"/.test(html(`/${a.slug}/`))).length);
  check('Artykuły ze spisem treści (dłuższe poradniki)', 'tak', articles.filter((a) => /class="contents"/.test(html(`/${a.slug}/`))).length >= 40 ? 'tak' : 'nie');
  check('Artykuły z sekcją źródeł', 50, articles.filter((a) => /class="sources"/.test(html(`/${a.slug}/`))).length);

  const resolve = (href) => { let u = href; if (u.startsWith(site)) u = u.slice(site.length) || '/'; const c = decodeURIComponent(u.split('#')[0].split('?')[0]); const t = path.join(dist, c); return c.endsWith('/') ? existsSync(path.join(t, 'index.html')) : existsSync(t); };
  let broken = 0; let internal = 0; let badAnchor = 0;
  for (const p of pages) for (const m of p.html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, '&');
    if (href.startsWith('/') || href.startsWith(site)) {
      internal++;
      if (!resolve(href)) { broken++; err(`Niedziałający link: ${p.url} -> ${href}`); }
    } else if (href.startsWith('#') && href.length > 1) {
      const id = decodeURIComponent(href.slice(1));
      if (!p.html.includes(`id="${id}"`) && !p.html.includes(`id="${href.slice(1)}"`)) { badAnchor++; err(`Kotwica ${href} nie istnieje na ${p.url}`); }
    }
  }
  check('Niedziałające linki wewnętrzne', 0, broken);
  check('Niedziałające kotwice (spis treści)', 0, badAnchor);
  info('Sprawdzone linki wewnętrzne', internal);

  let imgs = 0; let noAlt = 0; let missing = 0; let lazy = 0; let noSize = 0; let noSrcset = 0;
  for (const p of pages) for (const m of p.html.matchAll(/<img\s([^>]*)>/g)) {
    imgs++; const a = m[1];
    if (!/(^|\s)alt="/.test(a)) noAlt++;
    if (/loading="lazy"/.test(a)) lazy++;
    if (!/width="\d+"/.test(a) || !/height="\d+"/.test(a)) noSize++;
    if (!/srcset="/.test(a)) noSrcset++;
    for (const src of [(a.match(/src="([^"]+)"/) || [])[1], ...((a.match(/srcset="([^"]+)"/) || [])[1] || '').split(',').map((s) => s.trim().split(' ')[0])].filter(Boolean)) if (src.startsWith('/') && !existsSync(path.join(dist, src))) { missing++; err(`Brak obrazu ${src} (${p.url})`); }
  }
  check('Obrazy bez atrybutu alt', 0, noAlt);
  check('Obrazy bez wymiarów (stabilny układ)', 0, noSize);
  check('Obrazy bez wariantów responsywnych (srcset)', 0, noSrcset);
  check('Niedziałające adresy obrazów (src i srcset)', 0, missing);
  info('Obrazy z lazy loading / wszystkie', `${lazy} / ${imgs}`);
  check('Artykuły ze zdjęciem wyróżniającym i opisem ALT', 50, articles.filter((a) => /class="story__figure"[\s\S]*?<img[^>]+alt="[^"]{15,}"/.test(html(`/${a.slug}/`))).length);
  check('Unikatowe zdjęcia wyróżniające (różne pliki)', 50, new Set(articles.map((a) => readFileSync(path.join(dist, 'obrazy', `${a.slug}-960.webp`)).toString('base64').slice(200, 2200))).size);
  check('Grafiki Open Graph artykułów (JPG 1200×630)', 50, articles.filter((a) => existsSync(path.join(dist, 'obrazy/udostepnij', `${a.slug}.jpg`))).length);
  const heaviest = Math.max(...all.filter((f) => f.endsWith('.webp')).map((f) => statSync(f).size));
  check('Najcięższe zdjęcie WebP poniżej 250 KB', 'tak', heaviest < 250 * 1024 ? 'tak' : 'nie');
  const jsFiles = all.filter((f) => f.endsWith('.js'));
  check('Pliki JavaScript wysyłane do przeglądarki (lekki magazyn bez bibliotek)', 0, jsFiles.length);

  // Linki klientów w HTML
  const hc = [];
  for (const p of pages) for (const m of p.html.matchAll(/<a\s([^>]*)>/g)) { const href = (m[1].match(/href="([^"]+)"/) || [])[1] || ''; if (/^https?:/.test(href) && baseHosts.has(hostOf(href))) hc.push({ url: p.url, rel: (m[1].match(/rel="([^"]+)"/) || [])[1] || '' }); }
  check('Linki do klientów w całym serwisie (HTML)', 10, hc.length);
  check('Linki do klientów poza 10 artykułami sponsorowanymi', 0, hc.filter((l) => !sponsored.some((a) => l.url === `/${a.slug}/`)).length);
  check('Linki do klientów bez rel="sponsored"', 0, hc.filter((l) => !/\bsponsored\b/.test(l.rel)).length);
  check('Artykuły sponsorowane z ramką „Artykuł sponsorowany”', 10, sponsored.filter((a) => /class="disclosure"[^>]*>[\s\S]*?Artykuł sponsorowany/.test(html(`/${a.slug}/`))).length);
  check('Redakcyjne artykuły bez oznaczenia sponsorowanego', 40, editorial.filter((a) => !/Artykuł sponsorowany/.test(html(`/${a.slug}/`))).length);
  check('Strona „Materiały partnerskie” wymienia wszystkie 10', 10, sponsored.filter((a) => html('/materialy-partnerskie/').includes(`href="/${a.slug}/"`)).length);
  const chrome = pages.map((p) => [/<header class="masthead"[\s\S]*?<\/header>/, /<footer class="colophon"[\s\S]*?<\/footer>/, /<aside class="aside-picks"[\s\S]*?<\/aside>/, /<section class="further"[\s\S]*?<\/section>/].map((re) => (p.html.match(re) || [''])[0]).join('')).join('');
  check('Linki do klientów w nagłówku, stopce i blokach polecanych', 0, [...baseHosts].filter((h) => chrome.includes(h)).length);

  // Układ magazynu
  const home = html('/');
  check('Okładka z pełnoszerokim zdjęciem wyróżnionego tekstu', 'tak', /<section class="cover"[\s\S]*?class="photo photo--wide"[\s\S]*?class="cover__title"/.test(home) ? 'tak' : 'nie');
  check('Sekcja „Temat tygodnia” z oznaczeniem wyboru redakcji', 'tak', /Temat tygodnia[\s\S]{0,80}wybór redakcji/.test(home) ? 'tak' : 'nie');
  check('Sekcja „Warto przeczytać” (6 tekstów)', 6, (home.match(/<ol class="worth">([\s\S]*?)<\/ol>/) || ['', ''])[1].split('<li').length - 1);
  check('Karty o zróżnicowanych proporcjach na stronie głównej', 'tak', ['tile--tall', 'tile--wide', 'tile--square', 'tile--row'].every((c) => home.includes(c)) ? 'tak' : 'nie');
  check('Strona główna pokazuje mniej niż 50 tekstów', 'tak', new Set([...home.matchAll(/class="tile__title"><a href="([^"]+)"/g)].map((m) => m[1])).size < 50 ? 'tak' : 'nie');

  // Archiwa i paginacja
  const sorted = [...articles].sort((a, b) => b.published - a.published).map((a) => `/${a.slug}/`);
  const archPages = Math.ceil(50 / archivePerPage);
  const archUrls = ['/wszystkie-teksty/', ...Array.from({ length: archPages - 1 }, (_, i) => `/wszystkie-teksty/strona-${i + 2}/`)];
  check('Strony archiwum „Wszystkie teksty”', archPages, archUrls.filter((u) => byUrl.has(u)).length);
  const listed = archUrls.flatMap((u) => [...html(u).matchAll(/class="ledger__title"><a href="([^"]+)"/g)].map((m) => m[1]));
  check('Archiwum zawiera 50 tekstów od najnowszego', 'tak', JSON.stringify(listed) === JSON.stringify(sorted) ? 'tak' : 'nie');
  check('Archiwa miesięczne z właściwą liczbą tekstów', 3, Object.entries(MONTHS).filter(([m, n]) => (html(`/wszystkie-teksty/2026-${m}/`).match(/class="ledger__item"/g) || []).length === n).length);
  let rubricOk = 0; let rubricPages = 0;
  for (const r of rubrics) {
    const n = articles.filter((a) => a.fm.rubric === r.slug).length; const pc = Math.ceil(n / perPage);
    const urls = ['/rubryka/' + r.slug + '/', ...Array.from({ length: pc - 1 }, (_, i) => `/rubryka/${r.slug}/strona-${i + 2}/`)];
    rubricPages += urls.filter((u) => byUrl.has(u)).length;
    if (articles.filter((a) => a.fm.rubric === r.slug).every((a) => urls.some((u) => html(u).includes(`href="/${a.slug}/"`)))) rubricOk++; else err(`Rubryka ${r.slug}: archiwum nie linkuje do wszystkich tekstów`);
  }
  check('Archiwa rubryk linkujące do wszystkich swoich tekstów', 8, rubricOk);
  check('Strony rubryk z paginacją', Object.values(EXPECTED).reduce((s, n) => s + Math.ceil(n / perPage), 0), rubricPages);
  check('Paginacja z rel="prev" i rel="next"', 'tak', /rel="next"/.test(html('/wszystkie-teksty/')) && /rel="prev"/.test(html(archUrls.at(-1))) ? 'tak' : 'nie');
  check('Spis treści serwisu linkuje do wszystkich 50 tekstów', 50, articles.filter((a) => html('/spis-tresci/').includes(`href="/${a.slug}/"`)).length);
  check('Strona 404', 'tak', byUrl.has('/404.html') && /noindex/.test(html('/404.html')) ? 'tak' : 'nie');

  // Strony informacyjne i dane wydawcy
  const info_ = ['/o-magazynie/', '/kontakt/', '/prywatnosc/', '/pliki-cookies/', '/zasady-publikacji/', '/materialy-partnerskie/'];
  check('Strony informacyjne', 6, info_.filter((u) => byUrl.has(u)).length);
  const dep = JSON.parse(readFileSync(path.join(root, 'deployment.config.json'), 'utf8'));
  const ready = Boolean(dep.wydawca?.nazwa && dep.wydawca?.adres && dep.kontakt?.email_redakcji);
  info('Dane wydawcy w deployment.config.json', ready ? 'uzupełnione' : 'brak – strony prawne noindex');
  if (!ready) check('Strony prawne z noindex do czasu uzupełnienia danych', 3, ['/kontakt/', '/prywatnosc/', '/pliki-cookies/'].filter((u) => /name="robots" content="noindex/.test(html(u))).length);
  check('Wymyślone dane wydawcy (NIP/KRS/REGON) w HTML', 0, pages.filter((p) => /NIP:?\s*\d{3}-?\d{3}-?\d{2}-?\d{2}|KRS:?\s*\d{10}|REGON:?\s*\d{9}/.test(p.html)).length);
  check('Informacja o demonstracyjnych datach (dopóki nie zastąpiono)', 'tak', dep.daty_demonstracyjne_zastapione || /daty przy tekstach są demonstracyjne/.test(home) ? 'tak' : 'nie');

  // Sitemap, robots, RSS
  const sm = existsSync(path.join(dist, 'sitemap.xml')) ? readFileSync(path.join(dist, 'sitemap.xml'), 'utf8') : '';
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check('Adresy w sitemap.xml spoza domeny', 0, locs.filter((l) => !l.startsWith(site + '/')).length);
  check('Duplikaty w sitemap.xml', 0, locs.length - new Set(locs).size);
  check('Adresy w sitemap.xml bez podstrony', 0, locs.filter((l) => !resolve(l)).length);
  check('Artykuły w sitemap.xml', 50, articles.filter((a) => locs.includes(`${site}/${a.slug}/`)).length);
  check('Strony noindex w sitemap.xml', 0, locs.filter((l) => /name="robots" content="noindex/.test(html(l.slice(site.length)))).length);
  info('Adresy w sitemap.xml', locs.length);
  const robots = existsSync(path.join(dist, 'robots.txt')) ? readFileSync(path.join(dist, 'robots.txt'), 'utf8') : '';
  check('robots.txt zgodny z trybem kompilacji', 'tak', local ? (/Disallow: \//.test(robots) ? 'tak' : 'nie') : (robots.includes(`Sitemap: ${site}/sitemap.xml`) && !/Disallow: \/\s*$/m.test(robots) ? 'tak' : 'nie'));
  check('Adresy localhost w kompilacji produkcyjnej', 0, local ? 0 : pages.filter((p) => /localhost:4321/.test(p.html)).length);
  check('Kanał RSS', 'tak', ((existsSync(path.join(dist, 'rss.xml')) ? readFileSync(path.join(dist, 'rss.xml'), 'utf8') : '').match(/<item>/g) || []).length >= 20 ? 'tak' : 'nie');
}

// ---------- Raport ----------
const site = (() => { try { return new URL((readFileSync(path.join(dist, 'index.html'), 'utf8').match(/<link rel="canonical" href="([^"]+)"/) || [])[1]).origin; } catch { return ''; } })();
const we = editorial.map((a) => a.words); const ws = sponsored.map((a) => a.words);
const report = `# Raport walidacji – Przestrzeń Wyboru

Wygenerowano: ${new Date().toISOString()} (skrypt \`scripts/validate-content.mjs\`).

## Wynik: ${errors.length ? `BŁĘDY (${errors.length})` : 'WSZYSTKIE KONTROLE ZALICZONE'}

| Kontrola | Oczekiwano | Wynik | Status |
|---|---|---|---|
${rows.map((r) => `| ${r.name} | ${r.expected} | ${r.actual} | ${r.ok ? 'OK' : 'BŁĄD'} |`).join('\n')}

## Rubryki

| Rubryka | Teksty | W tym sponsorowane |
|---|---:|---:|
${rubrics.map((r) => `| ${r.name} | ${articles.filter((a) => a.fm.rubric === r.slug).length} | ${sponsored.filter((a) => a.fm.rubric === r.slug).length} |`).join('\n')}

## Daty publikacji (demonstracyjne)

| Miesiąc | Teksty |
|---|---:|
${Object.entries(byMonth).map(([m, n]) => `| 2026-${m} | ${n} |`).join('\n')}

Długość (słowa): redakcyjne ${Math.min(...we)}–${Math.max(...we)}, sponsorowane ${Math.min(...ws)}–${Math.max(...ws)}.

## Linki do klientów (${clientLinks.length})

| Klient | Adres docelowy | Tytuł artykułu | Anchor | Adres artykułu | Słowa |
|---|---|---|---|---|---:|
${clientLinks.map((l) => { const a = bySlug.get(l.slug); const s = selected.find((x) => x.url === l.url) || {}; return `| ${s.nazwa || a.fm.partner} | ${l.url} | ${a.fm.title} | „${l.anchor}” | ${site}/${l.slug}/ | ${a.words} |`; }).join('\n')}

## Ostrzeżenia (${warnings.length})

${warnings.map((w) => `- ${w}`).join('\n') || '- brak'}

## Błędy (${errors.length})

${errors.map((e) => `- ${e}`).join('\n') || '- brak'}
`;
writeFileSync(path.join(root, 'RAPORT-WALIDACJI.md'), report);
console.log('\nKONTROLA KOŃCOWA – Przestrzeń Wyboru\n');
for (const r of rows) console.log(`${r.ok ? '✔' : '✘'} ${String(r.name).padEnd(74)} oczekiwano: ${String(r.expected).padEnd(8)} wynik: ${r.actual}`);
if (warnings.length) { console.log(`\nOstrzeżenia (${warnings.length}):`); warnings.forEach((w) => console.log('  ! ' + w)); }
if (errors.length) { console.log(`\nBłędy (${errors.length}):`); errors.forEach((e) => console.log('  ✘ ' + e)); process.exit(1); }
console.log('\nWszystkie kontrole zaliczone. Raport: RAPORT-WALIDACJI.md');
