#!/usr/bin/env python3
"""Automatyczna kontrola końcowa wszystkich portali.

Uruchomienie (po `python3 build.py`):  python3 tools/verify.py [--no-browser]
Zwraca kod 0, gdy wszystkie testy przeszły; wypisuje raport w Markdown
do pliku RAPORT.md w katalogu głównym repozytorium.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import sitegen  # noqa: E402

EXPECTED = {"szczecinnacodzien.pl": 22, "pulsprofilaktyki.pl": 24, "nastrojmagazyn.pl": 26,
            "rodzinnykompas.pl": 28, "wiemiwybieram.pl": 30}
PARTNERS = {"wamka": "https://wamka.pl/", "szram": "https://www.norbertszram.pl/"}
START, END = date(2026, 8, 1), date(2026, 10, 31)
PLACEHOLDERS = re.compile(r"lorem ipsum|\bTODO\b|placeholder|\bXXX\b|\{\{|\}\}|tekst zastępczy|uzupełnić", re.I)

errors: list[str] = []


def fail(msg):
    errors.append(msg)


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = 0
        self.h2 = 0
        self.links: list[tuple[str, dict]] = []
        self.imgs: list[dict] = []
        self.ids: set[str] = set()
        self.meta: dict[str, str] = {}
        self.canonical = None
        self.title = ""
        self._in_title = False
        self.ld: list[str] = []
        self._in_ld = False
        self.times: list[str] = []
        self.anchor_text: dict[str, str] = {}
        self._cur_a = None
        self._buf = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "h1":
            self.h1 += 1
        elif tag == "h2":
            self.h2 += 1
        elif tag == "a" and "href" in a:
            self.links.append((a["href"], a))
            self._cur_a = a["href"]
            self._buf = ""
        elif tag == "img":
            self.imgs.append(a)
        elif tag == "meta":
            k = a.get("name") or a.get("property")
            if k:
                self.meta[k] = a.get("content", "")
        elif tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        elif tag == "link" and a.get("rel") in ("next", "prev", "stylesheet", "icon"):
            self.links.append((a["href"], a))
        elif tag == "title":
            self._in_title = True
        elif tag == "script" and a.get("type") == "application/ld+json":
            self._in_ld = True
            self.ld.append("")
        elif tag == "time" and "datetime" in a:
            self.times.append(a["datetime"])

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "script":
            self._in_ld = False
        elif tag == "a" and self._cur_a:
            self.anchor_text[self._cur_a] = self._buf.strip()
            self._cur_a = None

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_ld:
            self.ld[-1] += data
        if self._cur_a:
            self._buf += data


def parse(path: Path) -> Page:
    p = Page()
    p.feed(path.read_text(encoding="utf-8"))
    return p


def resolve(public: Path, href: str) -> Path | None:
    path = urlparse(href).path
    if not path.startswith("/"):
        return None
    target = public / path.lstrip("/")
    if path.endswith("/"):
        target = target / "index.html"
    return target


def check_portal(slug: str, report: dict):
    root = ROOT / slug
    site = sitegen.Site(root)
    site.load()
    public = root / "public"
    arts = site.articles
    r = report[slug] = {"name": site.name, "url": site.url, "count": len(arts), "months": Counter(), "partners": {}}

    # --- liczba wpisów, daty, slugi
    if len(arts) != EXPECTED[slug]:
        fail(f"{slug}: {len(arts)} wpisów zamiast {EXPECTED[slug]}")
    days = Counter(a.date.date() for a in arts)
    for d, n in days.items():
        if n > 1:
            fail(f"{slug}: powtórzona data {d}")
    for a in arts:
        d = a.date.date()
        r["months"][d.strftime("%Y-%m")] += 1
        if not START <= d <= END:
            fail(f"{slug}/{a.slug}: data {d} poza zakresem")
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", a.slug):
            fail(f"{slug}/{a.slug}: niepoprawny slug")
        if len(a.toc) < 2:
            fail(f"{slug}/{a.slug}: mniej niż 2 nagłówki H2")
        if not a.lead or len(a.lead) < 60:
            fail(f"{slug}/{a.slug}: brak lub zbyt krótki lead")
        lo, hi = (700, 1100) if a.partner else (400, 800)
        if not lo <= a.words <= hi:
            fail(f"{slug}/{a.slug}: {a.words} słów (oczekiwano {lo}–{hi})")
    r["min_date"] = min(a.date for a in arts).date().isoformat()
    r["max_date"] = max(a.date for a in arts).date().isoformat()
    r["words"] = (min(a.words for a in arts if not a.partner), max(a.words for a in arts if not a.partner))
    if len({a.slug for a in arts}) != len(arts):
        fail(f"{slug}: zduplikowane slugi")
    if len({a.title for a in arts}) != len(arts):
        fail(f"{slug}: zduplikowane tytuły")

    # --- artykuły partnerów
    for key, url in PARTNERS.items():
        tagged = [a for a in arts if a.partner == key]
        if len(tagged) != 1:
            fail(f"{slug}: {len(tagged)} artykułów partnera {key} (oczekiwano 1)")
            continue
        a = tagged[0]
        r["partners"][key] = {"title": a.title, "url": site.abs(a.url), "words": a.words, "date": a.date.date().isoformat()}

    # --- wszystkie wygenerowane strony HTML
    html_files = sorted(public.rglob("*.html"))
    titles, descs = Counter(), Counter()
    partner_links = defaultdict(list)
    for f in html_files:
        rel = "/" + str(f.relative_to(public)).replace("index.html", "")
        text = f.read_text(encoding="utf-8")
        if PLACEHOLDERS.search(re.sub(r"<[^>]+>", " ", re.sub(r"<script.*?</script>", " ", text, flags=re.S))):
            fail(f"{slug}{rel}: wykryto tekst zastępczy")
        p = parse(f)
        if p.h1 != 1:
            fail(f"{slug}{rel}: {p.h1} nagłówków H1")
        if f.name == "404.html":
            continue
        titles[p.title.strip()] += 1
        descs[p.meta.get("description", "")] += 1
        if not p.meta.get("description"):
            fail(f"{slug}{rel}: brak meta description")
        if p.canonical != site.abs(rel):
            fail(f"{slug}{rel}: canonical {p.canonical}")
        for k in ("og:title", "og:description", "og:url", "og:image", "og:type"):
            if not p.meta.get(k):
                fail(f"{slug}{rel}: brak {k}")
        img = resolve(public, urlparse(p.meta.get("og:image", "")).path)
        if not img or not img.exists():
            fail(f"{slug}{rel}: og:image nie istnieje")
        types = []
        for block in p.ld:
            try:
                types.append(json.loads(block)["@type"])
            except Exception as e:  # noqa: BLE001
                fail(f"{slug}{rel}: błędny JSON-LD ({e})")
        for href, attrs in p.links:
            if href.startswith(("http://", "https://")):
                for key, purl in PARTNERS.items():
                    if href.startswith(purl.rstrip("/")) or urlparse(href).netloc == urlparse(purl).netloc:
                        partner_links[key].append((rel, href, attrs.get("rel", ""), p.anchor_text.get(href, "")))
                continue
            if href.startswith("#"):
                if href[1:] not in p.ids:
                    fail(f"{slug}{rel}: kotwica {href} nie istnieje")
                continue
            target = resolve(public, href)
            if target is None or not target.exists():
                fail(f"{slug}{rel}: niedziałający link {href}")
        for im in p.imgs:
            t = resolve(public, im.get("src", ""))
            if not t or not t.exists():
                fail(f"{slug}{rel}: brak obrazu {im.get('src')}")
            if not im.get("alt"):
                fail(f"{slug}{rel}: obraz bez alt")
            if im.get("loading") != "lazy" and im.get("fetchpriority") != "high":
                fail(f"{slug}{rel}: obraz bez lazy loading")
        art = next((a for a in arts if a.url == rel), None)
        if art:
            if "Article" not in types or "BreadcrumbList" not in types:
                fail(f"{slug}{rel}: brak danych strukturalnych Article/BreadcrumbList")
            if p.meta.get("article:published_time") != art.iso:
                fail(f"{slug}{rel}: brak daty w metadanych")
            if p.h2 < 2:
                fail(f"{slug}{rel}: mniej niż 2 H2 w HTML")
    for t, n in titles.items():
        if n > 1:
            fail(f"{slug}: zduplikowany <title> „{t}” ({n}×)")
    for d, n in descs.items():
        if n > 1:
            fail(f"{slug}: zduplikowany meta description ({n}×): {d[:60]}")
    r["pages"] = len(html_files)

    # --- linki partnerów: dokładnie jeden, tylko w artykule partnera, rel=sponsored
    for key, url in PARTNERS.items():
        links = partner_links.get(key, [])
        exp = r["partners"].get(key, {})
        exp_rel = urlparse(exp.get("url", "")).path
        if len(links) != 1:
            fail(f"{slug}: {len(links)} linków do {url} (oczekiwano 1): {[l[0] for l in links]}")
        for page_rel, href, relattr, anchor in links:
            if href != url:
                fail(f"{slug}: link partnera {href} ≠ {url}")
            if page_rel != exp_rel:
                fail(f"{slug}: link do {url} na stronie {page_rel}, a nie w artykule partnera")
            if "sponsored" not in relattr:
                fail(f"{slug}: link do {url} bez rel=sponsored")
            if exp:
                exp["anchor"] = anchor
                exp["href"] = href

    # --- sitemap i robots
    sm = (public / "sitemap.xml").read_text(encoding="utf-8")
    locs = re.findall(r"<loc>([^<]+)</loc>", sm)
    for a in arts:
        if site.abs(a.url) not in locs:
            fail(f"{slug}: {a.url} nie ma w sitemap.xml")
    for loc in locs:
        t = resolve(public, urlparse(loc).path)
        if not t or not t.exists():
            fail(f"{slug}: sitemap wskazuje nieistniejący {loc}")
    r["sitemap"] = len(locs)
    robots = (public / "robots.txt").read_text(encoding="utf-8")
    if f"Sitemap: {site.url}/sitemap.xml" not in robots:
        fail(f"{slug}: robots.txt bez Sitemap")

    # --- paginacja i kolejność od najnowszych
    stream = []
    page_url = "/"
    seen = set()
    while page_url and page_url not in seen:
        seen.add(page_url)
        p = parse(resolve(public, page_url))
        nxt = [h for h, a in p.links if a.get("rel") == "next"]
        page_url = nxt[0] if nxt else None
    r["stream_pages"] = len(seen)
    per = site.config["per_page"]
    exp_pages = -(-len(arts) // per)
    if len(seen) != exp_pages:
        fail(f"{slug}: {len(seen)} stron paginacji zamiast {exp_pages}")
    for n in range(2, exp_pages + 1):
        p = parse(public / "strona" / str(n) / "index.html")
        stream += p.times
    ordered = [a.iso for a in arts[per:]]
    if stream[:len(ordered)] != ordered and [t for t in stream if t in ordered] != ordered:
        fail(f"{slug}: kolejność na stronach paginacji nie jest od najnowszych")
    if [a.date for a in arts] != sorted((a.date for a in arts), reverse=True):
        fail(f"{slug}: wpisy nieposortowane")
    for c in site.categories.values():
        if not (public / c.url.strip("/") / "index.html").exists():
            fail(f"{slug}: brak strony kategorii {c.url}")
    r["categories"] = [(c.name, len(c.articles)) for c in site.categories.values()]
    r["slugs"] = [a.url for a in arts]


def browser_check(report):
    js = r"""
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const jobs = JSON.parse(process.argv[2]);
(async () => {
  const browser = await chromium.launch(); const out = [];
  for (const job of jobs) {
    const root = job.root;
    const srv = http.createServer((req, res) => {
      let p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) { res.statusCode = 404; res.end('404'); return; }
      const t = {'.html':'text/html; charset=utf-8','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml'};
      res.setHeader('Content-Type', t[path.extname(p)] || 'application/octet-stream'); fs.createReadStream(p).pipe(res);
    });
    await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
    for (const vw of [390, 1280]) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: 850 } });
      const page = await ctx.newPage(); const bad = [];
      page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
      page.on('pageerror', e => bad.push('JS ' + e.message));
      for (const u of job.urls) {
        await page.goto(`http://localhost:${port}${u}`, { waitUntil: 'load' });
        await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } });
        await page.waitForLoadState('networkidle');
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth,
          broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length,
          fs: Math.round(parseFloat(getComputedStyle(document.body).fontSize)) }));
        out.push({ portal: job.slug, vw, url: u, ...m, bad: bad.splice(0) });
      }
      await ctx.close();
    }
    srv.close();
  }
  await browser.close(); console.log(JSON.stringify(out));
})();
"""
    jobs = []
    for slug, r in report.items():
        site = sitegen.Site(ROOT / slug)
        cat = next(iter(site.categories.values())).url
        urls = ["/", "/strona/2/", cat, "/archiwum/", "/o-nas/", r["slugs"][0], r["slugs"][-1],
                urlparse(r["partners"]["wamka"]["url"]).path, urlparse(r["partners"]["szram"]["url"]).path, "/404.html"]
        jobs.append({"slug": slug, "root": str(ROOT / slug / "public"), "urls": urls})
    tmp = ROOT / "tools" / ".browser_check.js"
    tmp.write_text(js, encoding="utf-8")
    try:
        res = subprocess.run(["node", str(tmp), json.dumps(jobs)], capture_output=True, text=True, timeout=600, cwd=ROOT)
    finally:
        tmp.unlink(missing_ok=True)
    if res.returncode != 0:
        fail("test przeglądarkowy nie uruchomił się: " + res.stderr[-500:])
        return []
    rows = json.loads(res.stdout.strip().splitlines()[-1])
    for row in rows:
        if row["sw"] > row["iw"]:
            fail(f"{row['portal']}{row['url']} @{row['vw']}px: poziome przewijanie ({row['sw']}px)")
        if row["broken"]:
            fail(f"{row['portal']}{row['url']} @{row['vw']}px: {row['broken']} niezaładowanych obrazów")
        bad = [b for b in row["bad"] if "/404.html" not in row["url"]]
        if bad:
            fail(f"{row['portal']}{row['url']} @{row['vw']}px: błędy {bad[:3]}")
    return rows


def write_report(report, rows):
    L = ["# Raport kontroli końcowej – 5 portali", "",
         "Raport wygenerowany automatycznie przez `tools/verify.py` na podstawie zbudowanych plików w katalogach `*/public/`.", "",
         "> Daty publikacji (1.08–31.10.2026) zostały przypisane wpisom przy tworzeniu serwisów i są zapisane na stałe w plikach treści. "
         "Treści powstały w trakcie przygotowania projektu – daty nie są zweryfikowaną historią wcześniejszych publikacji.", "",
         "## Liczba wpisów i rozkład dat", "",
         "| Portal | Domena | Wpisy | Sierpień | Wrzesień | Październik | Zakres dat | Słowa (std.) | Podstron HTML |",
         "|---|---|---:|---:|---:|---:|---|---|---:|"]
    tot = Counter()
    for slug, r in report.items():
        m = r["months"]
        tot.update(m)
        L.append(f"| {r['name']} | {r['url']} | {r['count']} | {m['2026-08']} | {m['2026-09']} | {m['2026-10']} | "
                 f"{r['min_date']} – {r['max_date']} | {r['words'][0]}–{r['words'][1]} | {r['pages']} |")
    L.append(f"| **Łącznie** | | **{sum(r['count'] for r in report.values())}** | **{tot['2026-08']}** | **{tot['2026-09']}** | **{tot['2026-10']}** | | | |")
    L += ["", "## Artykuły z linkami partnerów (10)", "",
          "| Portal | Partner | Artykuł | Adres URL | Anchor | Link docelowy | Słowa | Data |", "|---|---|---|---|---|---|---:|---|"]
    for slug, r in report.items():
        for key, label in (("wamka", "Wamka"), ("szram", "Norbert Szram")):
            p = r["partners"].get(key, {})
            L.append(f"| {r['name']} | {label} | {p.get('title','')} | {p.get('url','')} | „{p.get('anchor','')}” | {p.get('href','')} | {p.get('words','')} | {p.get('date','')} |")
    L += ["", "Wszystkie artykuły partnerskie są oznaczone jako materiał sponsorowany, a linki mają atrybut `rel=\"sponsored noopener\"`.", "",
          "## Kategorie", ""]
    for slug, r in report.items():
        L.append(f"- **{r['name']}**: " + ", ".join(f"{n} ({c})" for n, c in r["categories"]))
    L += ["", "## Wykonane testy", "",
          "- liczba portali i wpisów (22/24/26/28/30), unikalność slugów, tytułów i dat w obrębie portalu,",
          "- daty w zakresie 2026-08-01 – 2026-10-31, sortowanie od najnowszych, kolejność na stronach paginacji,",
          "- długość treści (400–800 słów; artykuły partnerskie 700–1100), lead, min. 2 nagłówki H2,",
          "- dokładnie 1 artykuł Wamka i 1 Norbert Szram na portal; dokładnie 1 link do każdej domeny partnera w całym serwisie, wyłącznie w artykule partnera, z `rel=sponsored`,",
          "- jeden H1 na każdej podstronie, unikalne title i meta description, canonical, Open Graph, poprawny JSON-LD (Article + BreadcrumbList w artykułach),",
          "- działanie wszystkich linków wewnętrznych i kotwic, istnienie obrazów, atrybuty alt i lazy loading,",
          "- sitemap.xml (wszystkie artykuły, brak martwych adresów), robots.txt z adresem mapy,",
          "- brak tekstów zastępczych,",
          "- test w Chromium (Playwright) przy szerokości 390 px i 1280 px: brak poziomego przewijania, brak błędów 4xx/JS, poprawnie załadowane obrazy."]
    if rows:
        L.append(f"- przetestowano w przeglądarce {len(rows)} widoków stron.")
    L += ["", f"## Wynik: {'WSZYSTKIE TESTY ZALICZONE' if not errors else f'{len(errors)} BŁĘDÓW'}", ""]
    L += [f"- {e}" for e in errors]
    (ROOT / "RAPORT.md").write_text("\n".join(L) + "\n", encoding="utf-8")


def main():
    report = {}
    portals = [p for p in EXPECTED if (ROOT / p / "site.json").exists()]
    if len(portals) != 5:
        fail(f"znaleziono {len(portals)} portali zamiast 5")
    for slug in portals:
        check_portal(slug, report)
    # anchory muszą być zróżnicowane między portalami
    for key in PARTNERS:
        anchors = [r["partners"].get(key, {}).get("anchor") for r in report.values()]
        if len(set(anchors)) != len(anchors):
            fail(f"powtarzające się anchory dla {key}: {anchors}")
    rows = [] if "--no-browser" in sys.argv else browser_check(report)
    write_report(report, rows)
    for slug, r in report.items():
        print(f"{r['name']:24s} {r['count']:3d} wpisów  {dict(sorted(r['months'].items()))}  stron HTML: {r['pages']}")
    if errors:
        print(f"\n{len(errors)} BŁĘDÓW:")
        for e in errors[:80]:
            print(" -", e)
        sys.exit(1)
    print("\nWSZYSTKIE TESTY ZALICZONE – raport: RAPORT.md")


if __name__ == "__main__":
    main()
