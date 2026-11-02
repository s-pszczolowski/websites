"""Rodzinny Kompas – ciepły, przyjazny blog poradnikowy dla rodzin.

Układ: kolorowy pasek, logo z kompasem, „pigułki” kategorii w kolorach
działów, powitalny baner z wyróżnionym wpisem, lista poziomych kart
z prawą kolumną boczną, artykuł z lepkim spisem treści po lewej.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from art import Image, ImageDraw, rng, mix, save, logo_png, font, hex2rgb, blur  # noqa: E402
from sitegen import esc, fmt_date, fmt_date_short  # noqa: E402

CORAL, SUN, INK, CREAM = "#ef6f5e", "#f6c344", "#2d2a32", "#fffaf3"
COMPASS = ('<svg width="40" height="40" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="#fff" stroke="#2d2a32" stroke-width="4"/>'
           '<path d="M32 10l7 22-7 22-7-22z" fill="#ef6f5e"/><path d="M32 32l7 0-7 22-7-22z" fill="#4a90c2"/><circle cx="32" cy="32" r="4" fill="#2d2a32"/></svg>')


def colors(site):
    return {c["slug"]: c.get("color", CORAL) for c in site.config["categories"]}


# ------------------------------------------------------------- grafika

def make_image(site, a, path, size):
    r = rng("kompas/" + a.slug)
    w, h = size
    base = colors(site).get(a.category.slug, CORAL)
    bg = mix(base, "#ffffff", .82)
    img = Image.new("RGBA", size, (*bg, 255))
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    pal = [base, SUN, "#3aa88c", "#4a90c2", "#8c5ea8", CORAL]
    for _ in range(5):
        cx, cy = r.uniform(0, w), r.uniform(0, h)
        rx, ry = r.uniform(.12, .3) * w, r.uniform(.15, .35) * h
        col = hex2rgb(r.choice(pal))
        d.rounded_rectangle([cx - rx, cy - ry, cx + rx, cy + ry], radius=int(min(rx, ry)), fill=(*col, 200))
    layer = blur(layer, w / 300)
    img = Image.alpha_composite(img, layer)
    d = ImageDraw.Draw(img)
    # małe gwiazdki i kropki
    for _ in range(14):
        x, y, s = r.uniform(0, w), r.uniform(0, h), r.uniform(.006, .016) * w
        if r.random() < .5:
            d.ellipse([x - s, y - s, x + s, y + s], fill=(255, 255, 255, 230))
        else:
            pts = []
            for k in range(10):
                ang = math.pi / 5 * k - math.pi / 2
                rad = s * (2 if k % 2 == 0 else .9)
                pts.append((x + rad * math.cos(ang), y + rad * math.sin(ang)))
            d.polygon(pts, fill=(*hex2rgb(SUN), 255))
    # łuk „ścieżki”
    d.arc([w * .1, h * .3, w * .9, h * 1.4], 200, 340, fill=(*hex2rgb(INK), 120), width=max(2, w // 250))
    save(img, path)


def make_static(site):
    out = site.out
    (out / "favicon.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' + COMPASS[COMPASS.index(">") + 1:], encoding="utf-8")
    logo_png(out / "logo.png", [("Rodzinny", "#ffffff", 88, "DejaVuSans-Bold.ttf"), ("Kompas", SUN, 88, "DejaVuSans-Bold.ttf")], CORAL)
    img = Image.new("RGB", (1200, 675), hex2rgb(CREAM))
    d = ImageDraw.Draw(img)
    for i, c in enumerate(["#ef6f5e", "#f6c344", "#3aa88c", "#4a90c2", "#8c5ea8"]):
        d.rectangle([i * 240, 0, i * 240 + 240, 24], fill=hex2rgb(c))
    d.text((90, 240), "Rodzinny Kompas", font=font("DejaVuSans-Bold.ttf", 104), fill=INK)
    d.text((96, 380), "rodzicielstwo · związek · emocje · zdrowie", font=font("DejaVuSans.ttf", 40), fill=CORAL)
    save(img, out / "img" / "og-default.jpg")


# ------------------------------------------------------------- fragmenty

def header(site, current):
    col = colors(site)
    pills = []
    for c in site.categories.values():
        cur = ' aria-current="page"' if current == c.slug else ""
        pills.append(f'<li><a href="{c.url}" style="--c:{col[c.slug]}"{cur}>{esc(c.name)}</a></li>')
    cur = ' aria-current="page"' if current == "archiwum" else ""
    pills.append(f'<li><a href="/archiwum/" style="--c:#2d2a32"{cur}>Archiwum</a></li>')
    return f"""<a class="skip" href="#tresc">Przejdź do treści</a>
<div class="stripe" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
<header class="top"><div class="box top-in">
<a class="logo" href="/" aria-label="Rodzinny Kompas – strona główna">{COMPASS}<span>Rodzinny<b>Kompas</b></span></a>
<p class="claim">Mądre wsparcie na co dzień – dla rodziców, par i całych rodzin</p></div>
<nav class="pills box" aria-label="Kategorie"><ul>{"".join(pills)}</ul></nav></header>"""


def footer(site):
    col = colors(site)
    cats = "".join(f'<li><a href="{c.url}"><i style="background:{col[c.slug]}"></i>{esc(c.name)}</a></li>' for c in site.categories.values())
    pages = "".join(f'<li><a href="{p.url}">{esc(p.title)}</a></li>' for p in site.pages)
    return f"""<footer class="foot"><div class="box foot-grid">
<div><a class="logo logo-foot" href="/">{COMPASS}<span>Rodzinny<b>Kompas</b></span></a><p>{esc(site.config["tagline"])}</p>
<p class="tiny">Artykuły mają charakter informacyjny. W sprawach zdrowia dziecka i dorosłych skonsultuj się z lekarzem. W nagłych sytuacjach dzwoń pod 112.</p></div>
<div><h2>Kategorie</h2><ul>{cats}</ul></div>
<div><h2>Informacje</h2><ul>{pages}<li><a href="/archiwum/">Archiwum wpisów</a></li><li><a href="/feed.xml">RSS</a></li></ul></div>
</div><p class="box tiny copy">© 2026 Rodzinny Kompas</p></footer>"""


def document(site, head, body, current=""):
    return f"""<!doctype html>
<html lang="pl">
<head>
{head}
</head>
<body>
{header(site, current)}
<main id="tresc" class="box">
{body}
</main>
{footer(site)}
</body>
</html>"""


def img(a, eager=False, sizes="(max-width: 700px) 100vw, 320px"):
    load = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return (f'<img src="{a.image_small}" srcset="{a.image_small} 640w, {a.image} 1200w" sizes="{sizes}" width="640" height="360" '
            f'alt="Ilustracja do wpisu: {esc(a.title)}" {load}>')


def chip(site, a):
    s = f'<a class="chip" href="{a.category.url}" style="--c:{colors(site)[a.category.slug]}">{esc(a.category.name)}</a>'
    if a.sponsored:
        s += '<span class="chip chip-sp">Artykuł sponsorowany</span>'
    return s


def row(site, a):
    return f"""<article class="row">
<a class="row-img" href="{a.url}" tabindex="-1" aria-hidden="true">{img(a)}</a>
<div class="row-txt"><div class="chips">{chip(site, a)}</div>
<h3><a href="{a.url}">{esc(a.title)}</a></h3><p>{esc(a.lead)}</p>
<p class="when"><time datetime="{a.iso}">{fmt_date(a.date)}</time> · {a.reading_minutes} min czytania</p></div></article>"""


def mini(site, a):
    return f"""<article class="mini"><a href="{a.url}" tabindex="-1" aria-hidden="true">{img(a, sizes="300px")}</a>
<div class="chips">{chip(site, a)}</div><h3><a href="{a.url}">{esc(a.title)}</a></h3>
<p class="when"><time datetime="{a.iso}">{fmt_date(a.date)}</time></p></article>"""


def sidebar(site):
    col = colors(site)
    cats = "".join(f'<li><a href="{c.url}" style="--c:{col[c.slug]}">{esc(c.name)}<span>{len(c.articles)}</span></a></li>' for c in site.categories.values())
    guides = [a for a in site.articles if a.form in ("poradnik", "lista kontrolna")][:5]
    gl = "".join(f'<li><a href="{a.url}">{esc(a.title)}</a></li>' for a in guides)
    months = "".join(f'<li><a href="/archiwum/#m-{k}">{lab}</a> <span>({len(it)})</span></li>' for k, lab, it in site.months())
    return f"""<aside class="side">
<section class="card-box"><h2>Kategorie</h2><ul class="cat-list">{cats}</ul></section>
<section class="card-box sun"><h2>Poradniki krok po kroku</h2><ol class="guide-list">{gl}</ol></section>
<section class="card-box"><h2>Archiwum</h2><ul class="month-list">{months}</ul></section>
</aside>"""


def pager(p):
    if p.total == 1:
        return ""
    parts = []
    if p.prev_url:
        parts.append(f'<a class="pg-btn" href="{p.prev_url}" rel="prev">‹ Nowsze wpisy</a>')
    parts.append('<span class="pg-dots">' + "".join(
        f'<span class="dot on" aria-current="page">{i}</span>' if i == p.number else f'<a class="dot" href="{u}">{i}</a>'
        for i, u in enumerate(p.urls, 1)) + "</span>")
    if p.next_url:
        parts.append(f'<a class="pg-btn" href="{p.next_url}" rel="next">Starsze wpisy ›</a>')
    return f'<nav class="pager" aria-label="Strony z wpisami">{"".join(parts)}</nav>'


def crumbs(items):
    out = []
    for i, (n, u) in enumerate(items):
        out.append(f'<li><a href="{u}">{esc(n)}</a></li>' if i < len(items) - 1 else f'<li aria-current="page">{esc(n)}</li>')
    return f'<nav class="crumbs" aria-label="Okruszki"><ol>{"".join(out)}</ol></nav>'


# ------------------------------------------------------------- strony

def render_all(site):
    per = site.config["per_page"]
    feat = site.featured()
    col = colors(site)
    for p in site.paginate(site.articles, per, "/"):
        if p.number == 1:
            render_home(site, feat, p)
            continue
        body = (f'<div class="layout"><div class="main-col"><header class="page-title"><h1>Wszystkie wpisy – strona {p.number}</h1>'
                f'<p>Poradniki i artykuły dla rodzin, od najnowszych.</p></header>{"".join(row(site, a) for a in p.items)}{pager(p)}</div>{sidebar(site)}</div>')
        head = site.head(title=f"Wszystkie wpisy – strona {p.number} | {site.name}",
                         description=f"Poradniki dla rodziców i rodzin w serwisie {site.name} – strona {p.number} z {p.total}.",
                         url=p.url, prev_url=p.prev_url, next_url=p.next_url)
        site.write(p.url, document(site, head, body))
    for c in site.categories.values():
        if not c.articles:
            continue
        for p in site.paginate(c.articles, per, c.url):
            bc = [("Start", "/"), (c.name, c.url)]
            sfx = f" – strona {p.number}" if p.number > 1 else ""
            body = (f'{crumbs(bc)}<header class="cat-hero" style="--c:{col[c.slug]}"><h1>{esc(c.name)}{sfx}</h1><p>{esc(c.description)}</p>'
                    f'<span class="count">{len(c.articles)} wpisów</span></header>'
                    f'<div class="layout"><div class="main-col">{"".join(row(site, a) for a in p.items)}{pager(p)}</div>{sidebar(site)}</div>')
            head = site.head(title=f"{c.name}{sfx} – poradniki dla rodzin | {site.name}",
                             description=f"{c.description} Kategoria {c.name} w serwisie {site.name}."[:160],
                             url=p.url, prev_url=p.prev_url, next_url=p.next_url, breadcrumbs=bc)
            site.write(p.url, document(site, head, body, c.slug))
    for a in site.articles:
        render_article(site, a)
    render_archive(site)
    for pg in site.pages:
        bc = [("Start", "/"), (pg.title, pg.url)]
        body = f'{crumbs(bc)}<article class="paper static"><h1>{esc(pg.title)}</h1><div class="content">{pg.body_html}</div></article>'
        site.write(pg.url, document(site, site.head(title=f"{pg.title} | {site.name}", description=pg.description,
                                                    url=pg.url, breadcrumbs=bc), body))
    head = site.head(title=f"Ups, nie ma takiej strony | {site.name}", description="Strona nie istnieje.", url="/404.html", noindex=True)
    body = ('<article class="paper static"><h1>Ups! Zgubiliśmy drogę</h1><div class="content"><p>Tej strony nie ma. '
            'Wróć na <a href="/">stronę główną</a> lub zajrzyj do <a href="/archiwum/">archiwum wpisów</a>.</p></div></article>')
    (site.out / "404.html").write_text(document(site, head, body), encoding="utf-8")


def render_home(site, feat, p):
    col = colors(site)
    latest = [a for a in site.articles if a is not feat][:3]
    rows = "".join(row(site, a) for a in p.items)
    topics = []
    for c in site.categories.values():
        if not c.articles:
            continue
        lis = "".join(f'<li><a href="{a.url}">{esc(a.title)}</a></li>' for a in c.articles[:3])
        topics.append(f'<section class="topic" style="--c:{col[c.slug]}"><h3><a href="{c.url}">{esc(c.name)}</a></h3><ul>{lis}</ul>'
                      f'<a class="topic-more" href="{c.url}">Zobacz wszystkie ({len(c.articles)}) →</a></section>')
    body = f"""<section class="welcome">
<div class="welcome-txt"><p class="hello">Polecamy na dziś</p><h1 class="vh">Rodzinny Kompas – poradniki dla rodziców i rodzin</h1>
<div class="chips">{chip(site, feat)}</div>
<h2><a href="{feat.url}">{esc(feat.title)}</a></h2><p>{esc(feat.lead)}</p>
<p class="when"><time datetime="{feat.iso}">{fmt_date(feat.date)}</time> · {feat.reading_minutes} min czytania</p>
<a class="btn" href="{feat.url}">Przeczytaj poradnik</a></div>
<a class="welcome-img" href="{feat.url}" tabindex="-1" aria-hidden="true">{img(feat, True, "(max-width: 900px) 100vw, 560px")}</a>
</section>
<section class="fresh" aria-labelledby="swieze-h"><h2 id="swieze-h" class="sec-title">Świeże wpisy</h2><div class="minis">{"".join(mini(site, a) for a in latest)}</div></section>
<div class="layout"><section class="main-col" aria-labelledby="wpisy-h"><h2 id="wpisy-h" class="sec-title">Najnowsze wpisy</h2>{rows}{pager(p)}</section>{sidebar(site)}</div>
<section aria-labelledby="tematy-h"><h2 id="tematy-h" class="sec-title">Tematy dla całej rodziny</h2><div class="topics">{"".join(topics)}</div></section>"""
    head = site.head(title=f"{site.name} – poradnik dla rodziców, par i rodzin",
                     description="Praktyczne poradniki o rodzicielstwie, związku, emocjach dzieci i dorosłych, zdrowiu rodziny, szkole i wspólnym czasie.",
                     url="/", next_url=p.next_url, extra_ld=site.website_ld())
    site.write("/", document(site, head, body, "home"))


def render_article(site, a):
    col = colors(site)
    bc = [("Start", "/"), (a.category.name, a.category.url), (a.title, a.url)]
    toc = "".join(f'<li><a href="#{hid}">{esc(t)}</a></li>' for hid, t in a.toc)
    rel = site.related(a, 4)
    newer, older = site.neighbours(a)
    sp = ""
    if a.sponsored:
        sp = ('<p class="sp-box"><strong>Artykuł sponsorowany.</strong> Wpis powstał we współpracy z partnerem i zawiera link sponsorowany. '
              'Ma charakter informacyjny i nie zastępuje konsultacji ze specjalistą.</p>')
    src = ""
    if a.sources:
        lis = []
        for s in a.sources:
            n, _, u = s.partition("|")
            lis.append(f'<li><a href="{esc(u.strip())}" rel="noopener noreferrer">{esc(n.strip())}</a></li>' if u.strip() else f"<li>{esc(n)}</li>")
        src = f'<section class="src"><h2>Źródła</h2><ul>{"".join(lis)}</ul></section>'
    nav = '<nav class="pn" aria-label="Poprzedni i następny wpis">'
    nav += f'<a href="{older.url}"><small>← Poprzedni wpis</small>{esc(older.title)}</a>' if older else "<span></span>"
    nav += f'<a href="{newer.url}"><small>Następny wpis →</small>{esc(newer.title)}</a>' if newer else "<span></span>"
    nav += "</nav>"
    body = f"""{crumbs(bc)}
<div class="post-grid">
<aside class="post-side"><div class="sticky"><div class="card-box"><h2>Spis treści</h2><ol class="toc">{toc}</ol></div>
<a class="back-cat" href="{a.category.url}" style="--c:{col[a.category.slug]}">Więcej w kategorii: {esc(a.category.name)}</a></div></aside>
<article class="paper post">
<header><div class="chips">{chip(site, a)}</div><h1>{esc(a.title)}</h1><p class="lead">{esc(a.lead)}</p>
<p class="when">Redakcja Rodzinnego Kompasu · <time datetime="{a.iso}">{fmt_date(a.date)}</time> · {a.reading_minutes} min czytania</p></header>
<figure class="hero-img">{img(a, True, "(max-width: 900px) 100vw, 760px")}</figure>
{sp}
<div class="content">{a.body_html}</div>
{src}
{nav}
</article>
</div>
<section aria-labelledby="sprawdz-h"><h2 id="sprawdz-h" class="sec-title">Sprawdź też</h2><div class="minis four">{"".join(mini(site, r) for r in rel)}</div></section>"""
    head = site.head(title=f"{a.seo_title or a.title} | {site.name}", description=a.description, url=a.url,
                     og_type="article", image=a.image, article=a, breadcrumbs=bc)
    site.write(a.url, document(site, head, body, a.category.slug), a.date)


def render_archive(site):
    col = colors(site)
    bc = [("Start", "/"), ("Archiwum", "/archiwum/")]
    blocks = []
    for key, lab, items in site.months():
        lis = "".join(f'<li><time datetime="{a.iso}">{fmt_date_short(a.date)}</time><a href="{a.url}">{esc(a.title)}</a>'
                      f'<i style="background:{col[a.category.slug]}" title="{esc(a.category.name)}"></i></li>' for a in items)
        blocks.append(f'<section class="card-box arch" id="m-{key}"><h2>{lab} <span>{len(items)} wpisów</span></h2><ul>{lis}</ul></section>')
    body = (f'{crumbs(bc)}<header class="page-title"><h1>Archiwum wpisów</h1><p>Wszystkie {len(site.articles)} wpisów według miesięcy publikacji.</p></header>'
            f'<div class="arch-grid">{"".join(blocks)}</div>')
    head = site.head(title=f"Archiwum wpisów | {site.name}", description=f"Archiwum poradników serwisu {site.name} według miesięcy.",
                     url="/archiwum/", breadcrumbs=bc)
    site.write("/archiwum/", document(site, head, body, "archiwum"))
