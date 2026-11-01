"""Szczecin na co dzień – klasyczny, gazetowy portal regionalny.

Układ: winieta w stylu dziennika, granatowy pasek działów przewijany na
telefonie, „Temat dnia” z listą najnowszych obok, siatka 4 kolumn,
bloki działów i prawa szpalta w artykułach.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from art import Image, ImageDraw, rng, mix, linear_gradient, save, logo_png  # noqa: E402
from sitegen import esc, fmt_date, fmt_date_short  # noqa: E402

NAVY, AMBER, SEA = "#13294b", "#e8a33d", "#2b6f8f"


# ------------------------------------------------------------- grafika

def make_image(site, a, path, size):
    r = rng(a.slug)
    w, h = size
    palettes = {
        "miasto": ("#13294b", "#2b6f8f"), "zdrowie": ("#1d4e5f", "#5fa8a0"),
        "uslugi": ("#3b3355", "#8a6fa8"), "mieszkancy": ("#5a3a22", "#c58b4b"),
        "region": ("#1f4d36", "#6ea36b"), "weekend": ("#6b2b2b", "#e8a33d"),
    }
    c1, c2 = palettes.get(a.category.slug, (NAVY, SEA))
    img = linear_gradient(size, c1, c2)
    d = ImageDraw.Draw(img, "RGBA")
    # „pejzaż” miasta portowego: fale, sylwetki budynków, słońce
    sun_x, sun_y = r.uniform(.15, .85) * w, r.uniform(.15, .4) * h
    rad = r.uniform(.07, .14) * w
    d.ellipse([sun_x - rad, sun_y - rad, sun_x + rad, sun_y + rad], fill=(*mix(AMBER, "#ffffff", .2), 210))
    base = h * r.uniform(.55, .68)
    x = 0
    while x < w:
        bw = r.uniform(.03, .08) * w
        bh = r.uniform(.08, .32) * h
        shade = mix(c1, "#000000", r.uniform(.2, .5))
        d.rectangle([x, base - bh, x + bw, base], fill=(*shade, 235))
        if r.random() < .3:
            d.polygon([(x, base - bh), (x + bw / 2, base - bh - bw * .9), (x + bw, base - bh)], fill=(*shade, 235))
        x += bw + r.uniform(0, .01) * w
    d.rectangle([0, base, w, h], fill=(*mix(c2, "#0b1a2e", .55), 255))
    for i in range(7):
        y = base + (i + 1) * (h - base) / 8
        amp = r.uniform(2, 6) * w / 1200
        pts = [(px, y + amp * ((px // (w / 24)) % 2)) for px in range(0, w + 50, int(w / 24))]
        d.line(pts, fill=(255, 255, 255, 60), width=max(1, int(w / 600)))
    save(img, path)


def make_static(site):
    out = site.out
    (out / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="6" fill="#13294b"/>'
        '<text x="32" y="42" font-family="Georgia,serif" font-size="30" font-weight="700" fill="#fff" text-anchor="middle">Sz</text>'
        '<rect x="12" y="50" width="40" height="4" fill="#e8a33d"/></svg>', encoding="utf-8")
    logo_png(out / "logo.png", [("SZCZECIN", "#ffffff", 84, "DejaVuSerif-Bold.ttf"),
                                ("na co dzień", "#e8a33d", 52, "DejaVuSerif.ttf")], NAVY)
    img = linear_gradient((1200, 675), NAVY, SEA)
    d = ImageDraw.Draw(img)
    from art import font
    d.text((80, 250), "SZCZECIN", font=font("DejaVuSerif-Bold.ttf", 120), fill="#ffffff")
    d.text((86, 400), "na co dzień", font=font("DejaVuSerif.ttf", 70), fill=AMBER)
    save(img, out / "img" / "og-default.jpg")


# ------------------------------------------------------------- fragmenty

def masthead(site, current=""):
    nav = [f'<li><a href="/"{" aria-current=\"page\"" if current == "home" else ""}>Główna</a></li>']
    for c in site.categories.values():
        cur = ' aria-current="page"' if current == c.slug else ""
        nav.append(f'<li><a href="{c.url}"{cur}>{esc(c.name)}</a></li>')
    cur = ' aria-current="page"' if current == "archiwum" else ""
    nav.append(f'<li><a href="/archiwum/"{cur}>Archiwum</a></li>')
    return f"""<a class="skip" href="#tresc">Przejdź do treści</a>
<div class="topbar"><div class="wrap"><span>Portal regionalny · Szczecin i Pomorze Zachodnie</span>
<span class="topbar-links"><a href="/o-nas/">O nas</a><a href="/kontakt/">Kontakt</a><a href="/feed.xml">RSS</a></span></div></div>
<header class="masthead"><div class="wrap">
<a class="logo" href="/" aria-label="Szczecin na co dzień – strona główna"><span class="logo-main">Szczecin</span><span class="logo-sub">na co dzień</span></a>
<p class="masthead-tag">Wiadomości praktyczne dla mieszkańców</p>
</div></header>
<nav class="sections" aria-label="Działy"><div class="wrap"><ul>{"".join(nav)}</ul></div></nav>"""


def footer(site):
    cats = "".join(f'<li><a href="{c.url}">{esc(c.name)}</a></li>' for c in site.categories.values())
    pages = "".join(f'<li><a href="{p.url}">{esc(p.title)}</a></li>' for p in site.pages)
    return f"""<footer class="footer"><div class="wrap footer-grid">
<div><p class="footer-logo">Szczecin <em>na co dzień</em></p><p>{esc(site.config["tagline"])}</p>
<p class="small">Materiały mają charakter informacyjny i poradnikowy. W sprawach zdrowia skonsultuj się z lekarzem.</p></div>
<div><h2>Działy</h2><ul>{cats}</ul></div>
<div><h2>Informacje</h2><ul>{pages}<li><a href="/archiwum/">Archiwum publikacji</a></li><li><a href="/sitemap.xml">Mapa strony (XML)</a></li></ul></div>
</div><div class="wrap footer-bottom">© 2026 Szczecin na co dzień · Wszystkie prawa zastrzeżone</div></footer>"""


def document(site, head, body, current=""):
    return f"""<!doctype html>
<html lang="pl">
<head>
{head}
</head>
<body>
{masthead(site, current)}
<main id="tresc" class="wrap">
{body}
</main>
{footer(site)}
</body>
</html>"""


def img_tag(a, cls="", eager=False, sizes="(max-width: 700px) 100vw, 640px"):
    loading = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return (f'<img class="{cls}" src="{a.image_small}" srcset="{a.image_small} 640w, {a.image} 1200w" sizes="{sizes}" '
            f'width="640" height="360" alt="Ilustracja do artykułu: {esc(a.title)}" {loading}>')


def badge(a):
    return '<span class="sponsor-badge">Materiał sponsorowany</span>' if a.sponsored else ""


def card(a, variant="std"):
    t = f'<time datetime="{a.iso}">{fmt_date(a.date)}</time>'
    if variant == "line":
        return f'<li><a href="{a.url}"><span class="when">{fmt_date_short(a.date)}</span> {esc(a.title)}</a></li>'
    return f"""<article class="card card-{variant}">
<a class="card-img" href="{a.url}" tabindex="-1" aria-hidden="true">{img_tag(a)}</a>
<div class="card-body"><a class="kicker" href="{a.category.url}">{esc(a.category.name)}</a>{badge(a)}
<h3><a href="{a.url}">{esc(a.title)}</a></h3>
<p class="meta">{t}</p><p class="lead">{esc(a.lead)}</p></div>
</article>"""


def pager(p):
    if p.total == 1:
        return ""
    items = []
    if p.prev_url:
        items.append(f'<a class="pg-prev" href="{p.prev_url}" rel="prev">« Nowsze</a>')
    for i, u in enumerate(p.urls, 1):
        items.append(f'<span class="pg-cur" aria-current="page">{i}</span>' if i == p.number else f'<a href="{u}">{i}</a>')
    if p.next_url:
        items.append(f'<a class="pg-next" href="{p.next_url}" rel="next">Starsze »</a>')
    return f'<nav class="pager" aria-label="Paginacja">{"".join(items)}</nav>'


def crumbs(items):
    lis = []
    for i, (name, url) in enumerate(items):
        lis.append(f'<li><a href="{url}">{esc(name)}</a></li>' if i < len(items) - 1 else f'<li aria-current="page">{esc(name)}</li>')
    return f'<nav class="crumbs" aria-label="Okruszki"><ol>{"".join(lis)}</ol></nav>'


# ------------------------------------------------------------- strony

def render_all(site):
    per = site.config["per_page"]
    feat = site.featured()
    stream = site.paginate(site.articles, per, "/")
    for p in stream:
        if p.number == 1:
            render_home(site, feat, p)
        else:
            body = (f'<header class="page-head"><h1>Najnowsze publikacje – strona {p.number}</h1>'
                    f'<p>Wszystkie artykuły portalu od najnowszych do najstarszych.</p></header>'
                    f'<div class="grid grid-4">{"".join(card(a) for a in p.items)}</div>{pager(p)}')
            head = site.head(title=f"Najnowsze publikacje – strona {p.number} z {p.total} | {site.name}",
                             description=f"Archiwum artykułów portalu {site.name}, strona {p.number} z {p.total}: miasto, zdrowie, usługi i sprawy mieszkańców Szczecina.",
                             url=p.url, prev_url=p.prev_url, next_url=p.next_url)
            site.write(p.url, document(site, head, body))
    for c in site.categories.values():
        if not c.articles:
            continue
        for p in site.paginate(c.articles, per, c.url):
            suffix = f" – strona {p.number}" if p.number > 1 else ""
            lead_a, rest = (p.items[0], p.items[1:]) if p.number == 1 else (None, p.items)
            top = ""
            if lead_a:
                top = f'<div class="section-lead">{card(lead_a, "wide")}</div>'
            body = (crumbs([("Główna", "/"), (c.name, c.url)]) +
                    f'<header class="page-head"><p class="eyebrow">Dział</p><h1>{esc(c.name)}{suffix}</h1><p>{esc(c.description)}</p></header>'
                    f'{top}<div class="grid grid-3">{"".join(card(a) for a in rest)}</div>{pager(p)}')
            head = site.head(title=f"{c.name}{suffix} – artykuły | {site.name}",
                             description=f"{c.description} Dział {c.name} w portalu {site.name}."[:160],
                             url=p.url, prev_url=p.prev_url, next_url=p.next_url,
                             breadcrumbs=[("Główna", "/"), (c.name, c.url)])
            site.write(p.url, document(site, head, body, c.slug))
    for a in site.articles:
        render_article(site, a)
    render_archive(site)
    for pg in site.pages:
        body = (crumbs([("Główna", "/"), (pg.title, pg.url)]) +
                f'<article class="static"><h1>{esc(pg.title)}</h1>{pg.body_html}</article>')
        head = site.head(title=f"{pg.title} | {site.name}", description=pg.description, url=pg.url,
                         breadcrumbs=[("Główna", "/"), (pg.title, pg.url)])
        site.write(pg.url, document(site, head, body))
    head = site.head(title=f"Nie znaleziono strony | {site.name}", description="Strona nie istnieje.", url="/404.html", noindex=True)
    body = ('<section class="static"><h1>Nie znaleziono strony</h1><p>Adres mógł się zmienić. '
            'Przejdź do <a href="/">strony głównej</a> lub <a href="/archiwum/">archiwum publikacji</a>.</p></section>')
    (site.out / "404.html").write_text(document(site, head, body), encoding="utf-8")


def render_home(site, feat, p):
    latest = [a for a in site.articles if a is not feat][:7]
    sections = []
    for c in site.categories.values():
        items = c.articles[:3]
        if not items:
            continue
        sections.append(f"""<section class="dept"><header class="dept-head"><h2><a href="{c.url}">{esc(c.name)}</a></h2>
<a class="more" href="{c.url}">Wszystkie z działu »</a></header>
<div class="dept-body">{card(items[0], "wide")}<ul class="dept-list">{"".join(card(x, "line") for x in items[1:])}</ul></div></section>""")
    body = f"""<h1 class="visually-hidden">Szczecin na co dzień – portal regionalny</h1>
<section class="front" aria-labelledby="temat-dnia">
<article class="hero">
<a class="card-img" href="{feat.url}" tabindex="-1" aria-hidden="true">{img_tag(feat, eager=True, sizes="(max-width: 900px) 100vw, 760px")}</a>
<p class="eyebrow" id="temat-dnia">Wyróżniamy</p>
<a class="kicker" href="{feat.category.url}">{esc(feat.category.name)}</a>{badge(feat)}
<h2 class="hero-title"><a href="{feat.url}">{esc(feat.title)}</a></h2>
<p class="meta"><time datetime="{feat.iso}">{fmt_date(feat.date, True)}</time></p>
<p class="lead">{esc(feat.lead)}</p>
</article>
<aside class="ticker" aria-labelledby="najnowsze-h"><h2 id="najnowsze-h">Najnowsze</h2>
<ol>{"".join(f'<li><time datetime="{a.iso}">{fmt_date_short(a.date)}</time><a href="{a.url}">{esc(a.title)}</a></li>' for a in latest)}</ol>
<a class="more" href="/archiwum/">Pełne archiwum »</a></aside>
</section>
<section aria-labelledby="najnowsze-publikacje"><header class="dept-head"><h2 id="najnowsze-publikacje">Najnowsze publikacje</h2></header>
<div class="grid grid-4">{"".join(card(a) for a in p.items)}</div>{pager(p)}</section>
<div class="depts">{"".join(sections)}</div>"""
    head = site.head(title=f"{site.name} – wiadomości i poradniki dla mieszkańców Szczecina",
                     description="Portal regionalny o Szczecinie i Pomorzu Zachodnim: zdrowie, usługi, sprawy miejskie, sąsiedztwo i pomysły na weekend.",
                     url="/", next_url=p.next_url, extra_ld=site.website_ld())
    site.write("/", document(site, head, body, "home"))


def render_article(site, a):
    rel = site.related(a, 4)
    newer, older = site.neighbours(a)
    sources = ""
    if a.sources:
        sources = "<section class=\"sources\"><h2>Źródła i dalsza lektura</h2><ul>" + "".join(
            f"<li>{s_link(s)}</li>" for s in a.sources) + "</ul></section>"
    disclosure = ""
    if a.sponsored:
        disclosure = ('<p class="disclosure"><strong>Materiał sponsorowany.</strong> Artykuł powstał we współpracy z partnerem '
                      'i zawiera link sponsorowany. Ma charakter informacyjny i nie zastępuje porady specjalisty.</p>')
    nav = '<nav class="prevnext" aria-label="Sąsiednie artykuły">'
    if older:
        nav += f'<a href="{older.url}"><span>Poprzedni artykuł</span>{esc(older.title)}</a>'
    if newer:
        nav += f'<a class="next" href="{newer.url}"><span>Następny artykuł</span>{esc(newer.title)}</a>'
    nav += "</nav>"
    bc = [("Główna", "/"), (a.category.name, a.category.url), (a.title, a.url)]
    body = f"""{crumbs(bc)}
<div class="article-layout">
<article class="post">
<header class="post-head"><a class="kicker" href="{a.category.url}">{esc(a.category.name)}</a>{badge(a)}
<h1>{esc(a.title)}</h1>
<p class="post-lead">{esc(a.lead)}</p>
<p class="meta">Redakcja · <time datetime="{a.iso}">{fmt_date(a.date, True)}, godz. {a.date:%H:%M}</time> · {a.reading_minutes} min czytania</p>
</header>
<figure class="post-figure">{img_tag(a, eager=True, sizes="(max-width: 900px) 100vw, 760px")}<figcaption>Ilustracja redakcyjna</figcaption></figure>
{disclosure}
<div class="post-body">{a.body_html}</div>
{sources}
{nav}
</article>
<aside class="rail">
<section><h2>Czytaj także</h2><ul class="rail-list">{"".join(f'<li><a href="{r.url}">{img_tag(r, sizes="120px")}<span>{esc(r.title)}</span></a></li>' for r in rel)}</ul></section>
<section><h2>Działy</h2><ul class="rail-cats">{"".join(f'<li><a href="{c.url}">{esc(c.name)} <span>{len(c.articles)}</span></a></li>' for c in site.categories.values())}</ul></section>
</aside>
</div>"""
    head = site.head(title=f"{a.seo_title or a.title} | {site.name}", description=a.description, url=a.url,
                     og_type="article", image=a.image, article=a, breadcrumbs=bc)
    site.write(a.url, document(site, head, body, a.category.slug), a.date)


def s_link(s):
    name, _, url = s.partition("|")
    name, url = name.strip(), url.strip()
    return f'<a href="{esc(url)}" rel="noopener noreferrer">{esc(name)}</a>' if url else esc(name)


def render_archive(site):
    blocks = []
    for key, label, items in site.months():
        lis = "".join(f'<li><time datetime="{a.iso}">{fmt_date(a.date)}</time> <a href="{a.url}">{esc(a.title)}</a> '
                      f'<a class="kicker" href="{a.category.url}">{esc(a.category.name)}</a></li>' for a in items)
        blocks.append(f'<section class="arch-month" id="m-{key}"><h2>{label} <span>({len(items)})</span></h2><ul>{lis}</ul></section>')
    body = (crumbs([("Główna", "/"), ("Archiwum", "/archiwum/")]) +
            f'<header class="page-head"><h1>Archiwum publikacji</h1><p>Wszystkie {len(site.articles)} artykułów portalu w porządku chronologicznym.</p></header>'
            + "".join(blocks))
    head = site.head(title=f"Archiwum publikacji | {site.name}",
                     description=f"Pełne archiwum artykułów portalu {site.name} pogrupowane według miesięcy publikacji.",
                     url="/archiwum/", breadcrumbs=[("Główna", "/"), ("Archiwum", "/archiwum/")])
    site.write("/archiwum/", document(site, head, body, "archiwum"))
