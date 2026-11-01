"""Wspólny silnik generatora statycznych portali.

Silnik odpowiada wyłącznie za: wczytanie treści (Markdown z front matter),
konwersję Markdown -> HTML, generowanie metadanych SEO, danych
strukturalnych, sitemap, robots.txt, RSS i paginacji. Cały wygląd, układ
stron i organizacja treści należą do modułu ``theme.py`` każdego portalu.
"""
from __future__ import annotations

import html
import importlib.util
import json
import math
import re
import shutil
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Europe/Warsaw")

MONTHS_GEN = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca",
              "sierpnia", "września", "października", "listopada", "grudnia"]
MONTHS_NOM = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec",
              "sierpień", "wrzesień", "październik", "listopad", "grudzień"]
WEEKDAYS = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"]

PARTNER_DOMAINS = {"wamka": "https://wamka.pl/", "szram": "https://www.norbertszram.pl/"}


def esc(s: str) -> str:
    return html.escape(str(s), quote=True)


def slugify(text: str) -> str:
    table = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzACELNOSZZ")
    text = text.translate(table).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def fmt_date(d: datetime, weekday: bool = False) -> str:
    s = f"{d.day} {MONTHS_GEN[d.month - 1]} {d.year}"
    return f"{WEEKDAYS[d.weekday()]}, {s}" if weekday else s


def fmt_date_short(d: datetime) -> str:
    return d.strftime("%d.%m.%Y")


# ---------------------------------------------------------------- Markdown

INLINE_LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")


def inline(text: str, link_rel) -> str:
    out = []
    pos = 0
    for m in INLINE_LINK.finditer(text):
        out.append(_inline_plain(text[pos:m.start()]))
        label, url = m.group(1), m.group(2)
        out.append(link_rel(url, _inline_plain(label)))
        pos = m.end()
    out.append(_inline_plain(text[pos:]))
    return "".join(out)


def _inline_plain(t: str) -> str:
    t = esc(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)
    return t


def markdown(md: str, link_rel) -> tuple[str, list[tuple[str, str]]]:
    """Minimalny konwerter: ## / ###, akapity, listy, cytaty-ramki, linki."""
    lines = md.strip().splitlines()
    out: list[str] = []
    toc: list[tuple[str, str]] = []
    para: list[str] = []
    list_type = None
    quote: list[str] = []
    used_ids: set[str] = set()

    def flush_para():
        if para:
            out.append("<p>" + inline(" ".join(para), link_rel) + "</p>")
            para.clear()

    def flush_list():
        nonlocal list_type
        if list_type:
            out.append(f"</{list_type}>")
            list_type = None

    def flush_quote():
        if quote:
            body = " ".join(quote)
            out.append('<aside class="callout"><p>' + inline(body, link_rel) + "</p></aside>")
            quote.clear()

    for raw in lines:
        line = raw.rstrip()
        if not line.strip():
            flush_para(); flush_list(); flush_quote()
            continue
        if line.startswith("## ") or line.startswith("### "):
            flush_para(); flush_list(); flush_quote()
            level = 2 if line.startswith("## ") else 3
            text = line[level + 1:].strip()
            hid = slugify(text)[:60] or "sekcja"
            base, n = hid, 2
            while hid in used_ids:
                hid = f"{base}-{n}"; n += 1
            used_ids.add(hid)
            if level == 2:
                toc.append((hid, text))
            out.append(f'<h{level} id="{hid}">{inline(text, link_rel)}</h{level}>')
            continue
        if line.startswith("> "):
            flush_para(); flush_list()
            quote.append(line[2:].strip())
            continue
        m_ul = re.match(r"^[-*] (.+)$", line)
        m_ol = re.match(r"^\d+\. (.+)$", line)
        if m_ul or m_ol:
            flush_para(); flush_quote()
            t = "ul" if m_ul else "ol"
            if list_type != t:
                flush_list()
                out.append(f"<{t}>")
                list_type = t
            out.append("<li>" + inline((m_ul or m_ol).group(1), link_rel) + "</li>")
            continue
        if list_type and raw.startswith("  "):
            # kontynuacja elementu listy
            out[-1] = out[-1][:-5] + " " + inline(line.strip(), link_rel) + "</li>"
            continue
        flush_list(); flush_quote()
        para.append(line.strip())
    flush_para(); flush_list(); flush_quote()
    return "\n".join(out), toc


def plain_text(md: str) -> str:
    t = INLINE_LINK.sub(r"\1", md)
    t = re.sub(r"^#+ ", "", t, flags=re.M)
    t = re.sub(r"^[-*>] |^\d+\. ", "", t, flags=re.M)
    return t.replace("**", "").replace("*", "")


def word_count(text: str) -> int:
    return len(re.findall(r"[0-9A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+(?:[-'][0-9A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)*", text))


# ---------------------------------------------------------------- Model

@dataclass
class Category:
    slug: str
    name: str
    description: str
    url: str = ""
    articles: list = field(default_factory=list)


@dataclass
class Article:
    slug: str
    title: str
    lead: str
    category: Category
    date: datetime
    body_md: str
    seo_title: str = ""
    description: str = ""
    featured: bool = False
    partner: str = ""
    sources: list = field(default_factory=list)
    tags: list = field(default_factory=list)
    form: str = ""
    body_html: str = ""
    toc: list = field(default_factory=list)
    words: int = 0
    url: str = ""
    image: str = ""
    image_small: str = ""
    external_links: list = field(default_factory=list)

    @property
    def sponsored(self) -> bool:
        return bool(self.partner)

    @property
    def iso(self) -> str:
        return self.date.isoformat()

    @property
    def reading_minutes(self) -> int:
        return max(2, round(self.words / 200))


@dataclass
class Page:
    slug: str
    title: str
    description: str
    body_html: str
    url: str


def parse_front_matter(text: str, path: Path) -> tuple[dict, str]:
    if not text.startswith("---\n"):
        raise ValueError(f"{path}: brak front matter")
    end = text.index("\n---\n", 4)
    meta: dict = {}
    current_list = None
    for line in text[4:end].splitlines():
        if not line.strip():
            continue
        if line.startswith("  - ") and current_list is not None:
            meta[current_list].append(line[4:].strip())
            continue
        key, _, val = line.partition(":")
        key, val = key.strip(), val.strip()
        if val == "":
            meta[key] = []
            current_list = key
        else:
            meta[key] = val
            current_list = None
    return meta, text[end + 5:]


# ---------------------------------------------------------------- Site

class Site:
    def __init__(self, root: Path):
        self.root = root
        self.config = json.loads((root / "site.json").read_text(encoding="utf-8"))
        self.url = self.config["url"].rstrip("/")
        self.name = self.config["name"]
        self.out = root / "public"
        self.theme = self._load_theme()
        cat_prefix = self.config["category_prefix"].strip("/")
        self.categories: dict[str, Category] = {}
        for c in self.config["categories"]:
            self.categories[c["slug"]] = Category(
                c["slug"], c["name"], c["description"], url=f"/{cat_prefix}/{c['slug']}/")
        self.articles: list[Article] = []
        self.pages: list[Page] = []
        self.generated: list[tuple[str, str]] = []  # (url, lastmod)

    def _load_theme(self):
        spec = importlib.util.spec_from_file_location(f"theme_{self.root.name}", self.root / "theme.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    # -- linki w treści
    def link_rel(self, article: Article | None):
        def render(url: str, label_html: str) -> str:
            if url.startswith("/"):
                return f'<a href="{esc(url)}">{label_html}</a>'
            if article is not None:
                article.external_links.append(url)
            partner = any(url.startswith(p) for p in PARTNER_DOMAINS.values())
            rel = "sponsored noopener" if partner else "noopener noreferrer"
            cls = ' class="partner-link"' if partner else ""
            return f'<a href="{esc(url)}" rel="{rel}"{cls}>{label_html}</a>'
        return render

    def load(self):
        for path in sorted((self.root / "content").glob("*.md")):
            meta, body = parse_front_matter(path.read_text(encoding="utf-8"), path)
            slug = path.stem
            if meta.get("slug", slug) != slug:
                raise ValueError(f"{path}: slug niezgodny z nazwą pliku")
            cat = self.categories[meta["category"]]
            date = datetime.strptime(meta["date"], "%Y-%m-%d %H:%M").replace(tzinfo=TZ)
            a = Article(
                slug=slug, title=meta["title"], lead=meta["lead"], category=cat, date=date,
                body_md=body, seo_title=meta.get("seo_title", ""),
                description=meta.get("description", ""),
                featured=meta.get("featured", "") == "true", partner=meta.get("partner", ""),
                sources=meta.get("sources", []), tags=meta.get("tags", []) if isinstance(meta.get("tags"), list) else [t.strip() for t in meta.get("tags", "").split(",") if t.strip()],
                form=meta.get("form", ""), url=f"/{slug}/",
            )
            a.body_html, a.toc = markdown(body, self.link_rel(a))
            a.words = word_count(plain_text(body))
            a.image = f"/img/{slug}.jpg"
            a.image_small = f"/img/{slug}-640.jpg"
            if not a.description:
                a.description = truncate(a.lead, 158)
            cat.articles.append(a)
            self.articles.append(a)
        self.articles.sort(key=lambda a: a.date, reverse=True)
        for c in self.categories.values():
            c.articles.sort(key=lambda a: a.date, reverse=True)
        for path in sorted((self.root / "pages").glob("*.md")):
            meta, body = parse_front_matter(path.read_text(encoding="utf-8"), path)
            body_html, _ = markdown(body, self.link_rel(None))
            self.pages.append(Page(path.stem, meta["title"], meta["description"], body_html, f"/{path.stem}/"))

    # -- pomocnicze
    def abs(self, url: str) -> str:
        return self.url + url

    def featured(self) -> Article:
        for a in self.articles:
            if a.featured:
                return a
        return self.articles[0]

    def related(self, article: Article, n: int = 3) -> list[Article]:
        same = [a for a in article.category.articles if a is not article]
        others = sorted((a for a in self.articles if a.category is not article.category),
                        key=lambda a: abs((a.date - article.date).total_seconds()))
        return (same + others)[:n]

    def neighbours(self, article: Article):
        i = self.articles.index(article)
        newer = self.articles[i - 1] if i > 0 else None
        older = self.articles[i + 1] if i + 1 < len(self.articles) else None
        return newer, older

    def months(self) -> list[tuple[str, str, list[Article]]]:
        groups: dict[str, list[Article]] = {}
        for a in self.articles:
            groups.setdefault(a.date.strftime("%Y-%m"), []).append(a)
        res = []
        for key in sorted(groups, reverse=True):
            y, m = key.split("-")
            res.append((key, f"{MONTHS_NOM[int(m) - 1].capitalize()} {y}", groups[key]))
        return res

    def paginate(self, items: list, per_page: int, base: str):
        """Zwraca listę (numer, url, elementy, pages_meta)."""
        total = max(1, math.ceil(len(items) / per_page))
        urls = [base if i == 1 else f"{base}strona/{i}/" for i in range(1, total + 1)]
        res = []
        for i in range(1, total + 1):
            chunk = items[(i - 1) * per_page: i * per_page]
            res.append(Pagination(i, total, urls, chunk))
        return res

    # -- metadane
    def head(self, *, title: str, description: str, url: str, og_type: str = "website",
             image: str | None = None, article: Article | None = None,
             breadcrumbs: list[tuple[str, str]] | None = None, extra_ld: list | None = None,
             prev_url: str | None = None, next_url: str | None = None, noindex: bool = False) -> str:
        image_abs = self.abs(image or self.config.get("default_image", "/img/og-default.jpg"))
        parts = [
            '<meta charset="utf-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            f"<title>{esc(title)}</title>",
            f'<meta name="description" content="{esc(description)}">',
            f'<link rel="canonical" href="{esc(self.abs(url))}">',
            f'<meta name="robots" content="{"noindex, follow" if noindex else "index, follow, max-image-preview:large"}">',
            f'<meta property="og:locale" content="pl_PL">',
            f'<meta property="og:site_name" content="{esc(self.name)}">',
            f'<meta property="og:type" content="{og_type}">',
            f'<meta property="og:title" content="{esc(title)}">',
            f'<meta property="og:description" content="{esc(description)}">',
            f'<meta property="og:url" content="{esc(self.abs(url))}">',
            f'<meta property="og:image" content="{esc(image_abs)}">',
            '<meta property="og:image:width" content="1200">',
            '<meta property="og:image:height" content="675">',
            '<meta name="twitter:card" content="summary_large_image">',
            f'<meta name="theme-color" content="{self.config["theme_color"]}">',
            '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
            f'<link rel="alternate" type="application/rss+xml" title="{esc(self.name)}" href="/feed.xml">',
            '<link rel="stylesheet" href="/assets/style.css">',
        ]
        if prev_url:
            parts.append(f'<link rel="prev" href="{esc(self.abs(prev_url))}">')
        if next_url:
            parts.append(f'<link rel="next" href="{esc(self.abs(next_url))}">')
        ld = []
        if article:
            parts += [
                f'<meta property="article:published_time" content="{article.iso}">',
                f'<meta property="article:section" content="{esc(article.category.name)}">',
            ]
            ld.append({
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": article.title,
                "description": article.description,
                "image": [image_abs],
                "datePublished": article.iso,
                "dateModified": article.iso,
                "inLanguage": "pl-PL",
                "articleSection": article.category.name,
                "wordCount": article.words,
                "mainEntityOfPage": {"@type": "WebPage", "@id": self.abs(article.url)},
                "author": {"@type": "Organization", "name": f"Redakcja {self.name}", "url": self.abs("/o-nas/")},
                "publisher": {"@type": "Organization", "name": self.name, "url": self.url + "/",
                              "logo": {"@type": "ImageObject", "url": self.abs("/logo.png")}},
            })
        if breadcrumbs:
            ld.append({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": i + 1, "name": name, "item": self.abs(u)}
                    for i, (name, u) in enumerate(breadcrumbs)
                ],
            })
        ld += extra_ld or []
        for block in ld:
            parts.append('<script type="application/ld+json">' +
                         json.dumps(block, ensure_ascii=False).replace("</", "<\\/") + "</script>")
        return "\n".join(parts)

    def website_ld(self) -> list:
        return [{
            "@context": "https://schema.org", "@type": "WebSite", "name": self.name,
            "url": self.url + "/", "inLanguage": "pl-PL", "description": self.config["tagline"],
        }, {
            "@context": "https://schema.org", "@type": "Organization", "name": self.name,
            "url": self.url + "/", "logo": self.abs("/logo.png"),
        }]

    # -- zapis
    def write(self, url: str, content: str, lastmod: datetime | None = None, sitemap: bool = True):
        path = self.out / url.strip("/") / "index.html" if url != "/" else self.out / "index.html"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        if sitemap:
            self.generated.append((url, (lastmod or self.articles[0].date).date().isoformat()))

    def build(self):
        if self.out.exists():
            shutil.rmtree(self.out)
        self.out.mkdir(parents=True)
        self.load()
        shutil.copytree(self.root / "assets", self.out / "assets")
        self.theme.make_static(self)
        (self.out / "img").mkdir(exist_ok=True)
        for a in self.articles:
            self.theme.make_image(self, a, self.out / "img" / f"{a.slug}.jpg", (1200, 675))
            self.theme.make_image(self, a, self.out / "img" / f"{a.slug}-640.jpg", (640, 360))
        self.theme.render_all(self)
        self._sitemap()
        self._robots()
        self._feed()
        return self

    def _sitemap(self):
        rows = []
        seen = set()
        for url, lastmod in self.generated:
            if url in seen:
                raise ValueError(f"Zduplikowany URL {url}")
            seen.add(url)
            rows.append(f"  <url><loc>{esc(self.abs(url))}</loc><lastmod>{lastmod}</lastmod></url>")
        xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(rows) + "\n</urlset>\n")
        (self.out / "sitemap.xml").write_text(xml, encoding="utf-8")

    def _robots(self):
        (self.out / "robots.txt").write_text(
            "User-agent: *\nAllow: /\nDisallow: /404.html\n\n" f"Sitemap: {self.url}/sitemap.xml\n",
            encoding="utf-8")

    def _feed(self):
        items = []
        for a in self.articles[:20]:
            items.append(
                "<item>"
                f"<title>{esc(a.title)}</title><link>{esc(self.abs(a.url))}</link>"
                f"<guid isPermaLink=\"true\">{esc(self.abs(a.url))}</guid>"
                f"<pubDate>{a.date.strftime('%a, %d %b %Y %H:%M:%S %z')}</pubDate>"
                f"<category>{esc(a.category.name)}</category>"
                f"<description>{esc(a.lead)}</description></item>")
        xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>'
               f"<title>{esc(self.name)}</title><link>{self.url}/</link>"
               f"<description>{esc(self.config['tagline'])}</description><language>pl</language>"
               + "".join(items) + "</channel></rss>\n")
        (self.out / "feed.xml").write_text(xml, encoding="utf-8")


@dataclass
class Pagination:
    number: int
    total: int
    urls: list
    items: list

    @property
    def url(self):
        return self.urls[self.number - 1]

    @property
    def prev_url(self):
        return self.urls[self.number - 2] if self.number > 1 else None

    @property
    def next_url(self):
        return self.urls[self.number] if self.number < self.total else None


def truncate(text: str, n: int) -> str:
    if len(text) <= n:
        return text
    cut = text[:n].rsplit(" ", 1)[0].rstrip(",;:–-")
    return cut + "…"


def build(root: Path) -> Site:
    return Site(root).build()


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        s = build(Path(arg))
        print(f"{s.name}: {len(s.articles)} artykułów -> {s.out}")
