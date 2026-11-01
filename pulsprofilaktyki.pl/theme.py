"""Puls Profilaktyki – nowoczesny, „kliniczny” portal o zdrowiu.

Układ: jasny nagłówek z ikoną pulsu i rozwijanym menu (details) na telefonie,
kafelki tematów, karta wyróżniona z nakładką, karty z zaokrągleniami,
artykuł w jednej kolumnie ze spisem treści „W tym artykule” i bibliografią.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from art import Image, ImageDraw, rng, mix, linear_gradient, save, logo_png, blur, font  # noqa: E402
from sitegen import esc, fmt_date  # noqa: E402

TEAL, MINT, CORAL = "#0f766e", "#99f6e4", "#f97362"
ICONS = {  # proste ikony SVG dla tematów
    "profilaktyka": '<path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    "diagnostyka": '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    "zdrowie-psychiczne": '<path d="M12 21s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.6-7 10-7 10z"/>',
    "ruch": '<circle cx="13" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v4M7 12l3-4 4 1 3 3"/>',
    "zywienie": '<path d="M12 7c-3-3-8-1-8 4 0 5 4 10 8 10s8-5 8-10c0-5-5-7-8-4z"/><path d="M12 7c0-2 1-4 3-4"/>',
    "choroby-przewlekle": '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
}


def icon(slug, size=24):
    return (f'<svg class="ico" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS.get(slug, ICONS["profilaktyka"])}</svg>')


# ------------------------------------------------------------- grafika

def make_image(site, a, path, size):
    r = rng("puls" + a.slug)
    w, h = size
    pal = {
        "profilaktyka": ("#ecfdf5", "#0f766e", "#5eead4"), "diagnostyka": ("#eff6ff", "#1d4ed8", "#93c5fd"),
        "zdrowie-psychiczne": ("#f5f3ff", "#6d28d9", "#c4b5fd"), "ruch": ("#fff7ed", "#c2410c", "#fdba74"),
        "zywienie": ("#f7fee7", "#4d7c0f", "#bef264"), "choroby-przewlekle": ("#fef2f2", "#be123c", "#fda4af"),
    }
    bg, deep, light = pal.get(a.category.slug, ("#ecfdf5", TEAL, MINT))
    img = linear_gradient(size, bg, mix(light, bg, .55), vertical=False)
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(9):
        cx, cy = r.uniform(0, w), r.uniform(0, h)
        rad = r.uniform(.08, .3) * w
        col = mix(light, deep, r.uniform(0, .6))
        d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(*col, r.randint(60, 140)))
    layer = blur(layer, w / 60)
    img = Image.alpha_composite(img.convert("RGBA"), layer)
    d = ImageDraw.Draw(img)
    # linia pulsu
    y0 = h * r.uniform(.45, .65)
    pts, x = [], 0
    beat = r.uniform(.3, .7) * w
    while x <= w:
        y = y0
        if abs(x - beat) < w * .06:
            t = (x - beat) / (w * .06)
            y = y0 - math.sin(t * math.pi * 2) * h * .22 * (1 - abs(t))
        pts.append((x, y))
        x += w / 200
    d.line(pts, fill=(*[int(c) for c in mix(deep, "#ffffff", .1)], 255), width=max(2, int(w / 220)), joint="curve")
    save(img, path)


def make_static(site):
    out = site.out
    (out / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#0f766e"/>'
        '<path d="M8 34h12l5-12 8 22 5-10h18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        encoding="utf-8")
    logo_png(out / "logo.png", [("Puls", "#ffffff", 120, "DejaVuSans-Bold.ttf"), ("Profilaktyki", "#99f6e4", 64, "DejaVuSans.ttf")], TEAL)
    img = linear_gradient((1200, 675), "#ecfdf5", "#99f6e4", vertical=False)
    d = ImageDraw.Draw(img)
    d.text((90, 240), "Puls", font=font("DejaVuSans-Bold.ttf", 140), fill=TEAL)
    d.text((95, 410), "Profilaktyki", font=font("DejaVuSans.ttf", 72), fill="#134e4a")
    save(img, out / "img" / "og-default.jpg")


# ------------------------------------------------------------- fragmenty

LOGO = ('<a class="brand" href="/" aria-label="Puls Profilaktyki – strona główna">'
        '<svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18" fill="#0f766e"/>'
        '<path d="M8 34h12l5-12 8 22 5-10h18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        '<span><b>Puls</b>Profilaktyki</span></a>')


def header(site, current):
    links = []
    for c in site.categories.values():
        cur = ' aria-current="page"' if current == c.slug else ""
        links.append(f'<li><a href="{c.url}"{cur}>{esc(c.name)}</a></li>')
    cur = ' aria-current="page"' if current == "archiwum" else ""
    links.append(f'<li><a href="/archiwum/"{cur}>Archiwum</a></li>')
    nav = "".join(links)
    return f"""<a class="skip" href="#main">Przejdź do treści</a>
<header class="hdr"><div class="container hdr-in">{LOGO}
<nav class="nav-desktop" aria-label="Tematy"><ul>{nav}</ul></nav>
<details class="nav-mobile"><summary>Menu</summary><nav aria-label="Tematy (menu mobilne)"><ul>{nav}<li><a href="/o-nas/">O portalu</a></li></ul></nav></details>
</div></header>"""


def footer(site):
    cats = "".join(f'<li><a href="{c.url}">{esc(c.name)}</a></li>' for c in site.categories.values())
    pages = "".join(f'<li><a href="{p.url}">{esc(p.title)}</a></li>' for p in site.pages)
    return f"""<footer class="ftr"><div class="container">
<div class="ftr-grid"><div>{LOGO}<p>{esc(site.config["tagline"])}</p></div>
<nav aria-label="Tematy w stopce"><h2>Tematy</h2><ul>{cats}</ul></nav>
<nav aria-label="Informacje"><h2>Portal</h2><ul>{pages}<li><a href="/archiwum/">Archiwum</a></li><li><a href="/feed.xml">Kanał RSS</a></li></ul></nav></div>
<p class="ftr-note">Treści w serwisie mają charakter edukacyjny i nie zastępują porady lekarza, diagnozy ani leczenia. W nagłych przypadkach dzwoń pod numer 112.</p>
<p class="ftr-copy">© 2026 Puls Profilaktyki</p></div></footer>"""


def document(site, head, body, current=""):
    return f"""<!doctype html>
<html lang="pl">
<head>
{head}
</head>
<body>
{header(site, current)}
<main id="main">
{body}
</main>
{footer(site)}
</body>
</html>"""


def picture(a, eager=False, sizes="(max-width: 760px) 100vw, 420px"):
    load = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return (f'<img src="{a.image_small}" srcset="{a.image_small} 640w, {a.image} 1200w" sizes="{sizes}" width="640" height="360" '
            f'alt="Grafika ilustrująca temat: {esc(a.title)}" {load}>')


def tag(a):
    t = f'<a class="pill" href="{a.category.url}">{icon(a.category.slug, 14)}{esc(a.category.name)}</a>'
    if a.sponsored:
        t += '<span class="pill pill-sp">Artykuł sponsorowany</span>'
    return t


def card(a):
    return f"""<article class="card">
<a href="{a.url}" class="card-media" tabindex="-1" aria-hidden="true">{picture(a)}</a>
<div class="card-txt"><div class="tags">{tag(a)}</div>
<h3><a href="{a.url}">{esc(a.title)}</a></h3>
<p>{esc(a.lead)}</p>
<p class="date"><time datetime="{a.iso}">{fmt_date(a.date)}</time> · {a.reading_minutes} min</p></div>
</article>"""


def mini(a):
    return f"""<article class="mini"><a href="{a.url}" tabindex="-1" aria-hidden="true">{picture(a, sizes="140px")}</a>
<div><div class="tags">{tag(a)}</div><h3><a href="{a.url}">{esc(a.title)}</a></h3><p class="date"><time datetime="{a.iso}">{fmt_date(a.date)}</time></p></div></article>"""


def pager(p):
    if p.total == 1:
        return ""
    out = ['<nav class="pages" aria-label="Kolejne strony"><ul>']
    out.append(f'<li><a href="{p.prev_url}" rel="prev" aria-label="Poprzednia strona">←</a></li>' if p.prev_url else '<li><span class="off">←</span></li>')
    for i, u in enumerate(p.urls, 1):
        out.append(f'<li><span class="on" aria-current="page">{i}</span></li>' if i == p.number else f'<li><a href="{u}">{i}</a></li>')
    out.append(f'<li><a href="{p.next_url}" rel="next" aria-label="Następna strona">→</a></li>' if p.next_url else '<li><span class="off">→</span></li>')
    out.append("</ul></nav>")
    return "".join(out)


def crumbs(items):
    parts = []
    for i, (n, u) in enumerate(items):
        parts.append(f'<li><a href="{u}">{esc(n)}</a></li>' if i < len(items) - 1 else f'<li><span aria-current="page">{esc(n)}</span></li>')
    return f'<nav class="bc" aria-label="Ścieżka"><ol>{"".join(parts)}</ol></nav>'


# ------------------------------------------------------------- strony

def render_all(site):
    per = site.config["per_page"]
    feat = site.featured()
    for p in site.paginate(site.articles, per, "/"):
        if p.number == 1:
            render_home(site, feat, p)
            continue
        body = (f'<section class="container band"><header class="sec-head"><h1>Wszystkie artykuły <small>strona {p.number} z {p.total}</small></h1></header>'
                f'<div class="cards">{"".join(card(a) for a in p.items)}</div>{pager(p)}</section>')
        head = site.head(title=f"Wszystkie artykuły – strona {p.number} | {site.name}",
                         description=f"Przegląd artykułów o zdrowiu i profilaktyce w serwisie {site.name} – strona {p.number} z {p.total}.",
                         url=p.url, prev_url=p.prev_url, next_url=p.next_url)
        site.write(p.url, document(site, head, body))
    for c in site.categories.values():
        if not c.articles:
            continue
        for p in site.paginate(c.articles, per, c.url):
            sfx = f" (strona {p.number})" if p.number > 1 else ""
            bc = [("Start", "/"), (c.name, c.url)]
            body = (f'<section class="topic-hero"><div class="container">{crumbs(bc)}<div class="topic-ico">{icon(c.slug, 40)}</div>'
                    f'<h1>{esc(c.name)}{sfx}</h1><p>{esc(c.description)}</p><p class="count">{len(c.articles)} artykułów w temacie</p></div></section>'
                    f'<section class="container band"><div class="cards">{"".join(card(a) for a in p.items)}</div>{pager(p)}</section>')
            head = site.head(title=f"{c.name}{sfx} – artykuły i poradniki | {site.name}",
                             description=f"{c.description} Temat: {c.name}."[:160], url=p.url,
                             prev_url=p.prev_url, next_url=p.next_url, breadcrumbs=bc)
            site.write(p.url, document(site, head, body, c.slug))
    for a in site.articles:
        render_article(site, a)
    render_archive(site)
    for pg in site.pages:
        bc = [("Start", "/"), (pg.title, pg.url)]
        body = f'<div class="container narrow">{crumbs(bc)}<article class="prose static"><h1>{esc(pg.title)}</h1>{pg.body_html}</article></div>'
        site.write(pg.url, document(site, site.head(title=f"{pg.title} | {site.name}", description=pg.description,
                                                    url=pg.url, breadcrumbs=bc), body))
    head = site.head(title=f"Strona nie istnieje | {site.name}", description="Nie znaleziono strony.", url="/404.html", noindex=True)
    body = ('<div class="container narrow prose"><h1>Nie znaleźliśmy tej strony</h1><p>Sprawdź adres albo wróć do '
            '<a href="/">strony głównej</a>. Wszystkie publikacje znajdziesz w <a href="/archiwum/">archiwum</a>.</p></div>')
    (site.out / "404.html").write_text(document(site, head, body), encoding="utf-8")


def render_home(site, feat, p):
    side = [a for a in site.articles if a is not feat][:3]
    tiles = "".join(f'<a class="tile" href="{c.url}">{icon(c.slug, 30)}<strong>{esc(c.name)}</strong>'
                    f'<span>{esc(c.description)}</span><em>{len(c.articles)} artykułów</em></a>' for c in site.categories.values())
    topic_blocks = []
    for c in site.categories.values():
        if not c.articles:
            continue
        lis = "".join(f'<li><a href="{a.url}">{esc(a.title)}</a><time datetime="{a.iso}">{fmt_date(a.date)}</time></li>' for a in c.articles[:3])
        topic_blocks.append(f'<section class="topic-box"><h3>{icon(c.slug, 20)}<a href="{c.url}">{esc(c.name)}</a></h3><ul>{lis}</ul>'
                            f'<a class="link-more" href="{c.url}">Więcej w temacie →</a></section>')
    body = f"""<section class="container intro"><h1>Rzetelnie o zdrowiu – profilaktyka, diagnostyka i dobre samopoczucie</h1>
<p>{esc(site.config["tagline"])}</p></section>
<section class="container top" aria-label="Wyróżnione">
<article class="spot">
<a href="{feat.url}" class="spot-media" tabindex="-1" aria-hidden="true">{picture(feat, True, "(max-width: 900px) 100vw, 760px")}</a>
<div class="spot-txt"><span class="flag">Polecamy</span><div class="tags">{tag(feat)}</div>
<h2><a href="{feat.url}">{esc(feat.title)}</a></h2><p>{esc(feat.lead)}</p>
<p class="date"><time datetime="{feat.iso}">{fmt_date(feat.date)}</time> · {feat.reading_minutes} min czytania</p></div>
</article>
<div class="side"><h2 class="side-h">Świeżo opublikowane</h2>{"".join(mini(a) for a in side)}</div>
</section>
<section class="container band" aria-labelledby="tematy-h"><header class="sec-head"><h2 id="tematy-h">Tematy</h2></header><div class="tiles">{tiles}</div></section>
<section class="container band" aria-labelledby="najnowsze-h"><header class="sec-head"><h2 id="najnowsze-h">Najnowsze artykuły</h2><a href="/archiwum/">Archiwum →</a></header>
<div class="cards">{"".join(card(a) for a in p.items)}</div>{pager(p)}</section>
<section class="container band" aria-labelledby="dzialy-h"><header class="sec-head"><h2 id="dzialy-h">Przegląd tematów</h2></header>
<div class="topic-grid">{"".join(topic_blocks)}</div></section>"""
    head = site.head(title=f"{site.name} – portal o zdrowiu, profilaktyce i diagnostyce",
                     description="Rzetelne artykuły o profilaktyce, badaniach diagnostycznych, zdrowiu psychicznym, ruchu i żywieniu. Wiedza zrozumiała dla każdego.",
                     url="/", next_url=p.next_url, extra_ld=site.website_ld())
    site.write("/", document(site, head, body, "home"))


def render_article(site, a):
    bc = [("Start", "/"), (a.category.name, a.category.url), (a.title, a.url)]
    toc = "".join(f'<li><a href="#{hid}">{esc(t)}</a></li>' for hid, t in a.toc)
    refs = ""
    if a.sources:
        items = []
        for s in a.sources:
            n, _, u = s.partition("|")
            items.append(f'<li><a href="{esc(u.strip())}" rel="noopener noreferrer">{esc(n.strip())}</a></li>' if u.strip() else f"<li>{esc(n)}</li>")
        refs = f'<section class="refs"><h2>Bibliografia i źródła</h2><ol>{"".join(items)}</ol></section>'
    sp = ""
    if a.sponsored:
        sp = ('<div class="note note-sp"><strong>Artykuł sponsorowany.</strong> Publikacja przygotowana we współpracy z partnerem; '
              'zawiera link oznaczony jako sponsorowany. Informacje mają charakter ogólny.</div>')
    rel = site.related(a, 3)
    newer, older = site.neighbours(a)
    nav = '<nav class="pn" aria-label="Nawigacja między artykułami">'
    nav += f'<a href="{older.url}">← {esc(older.title)}</a>' if older else "<span></span>"
    nav += f'<a href="{newer.url}">{esc(newer.title)} →</a>' if newer else "<span></span>"
    nav += "</nav>"
    body = f"""<article class="post">
<header class="post-hdr"><div class="container narrow">{crumbs(bc)}<div class="tags">{tag(a)}</div>
<h1>{esc(a.title)}</h1><p class="post-lead">{esc(a.lead)}</p>
<p class="date">Opublikowano <time datetime="{a.iso}">{fmt_date(a.date)}</time> · Redakcja Puls Profilaktyki · {a.reading_minutes} min czytania</p></div></header>
<div class="container narrow">
<figure class="post-img">{picture(a, True, "(max-width: 760px) 100vw, 720px")}</figure>
{sp}
<nav class="toc" aria-label="Spis treści"><h2>W tym artykule</h2><ol>{toc}</ol></nav>
<div class="prose">{a.body_html}</div>
<div class="note">Artykuł ma charakter edukacyjny. Nie zastępuje konsultacji z lekarzem ani innym specjalistą, który zna Twoją sytuację zdrowotną.</div>
{refs}
{nav}
</div>
</article>
<section class="container band"><header class="sec-head"><h2>Przeczytaj również</h2></header><div class="cards">{"".join(card(r) for r in rel)}</div></section>"""
    head = site.head(title=f"{a.seo_title or a.title} | {site.name}", description=a.description, url=a.url,
                     og_type="article", image=a.image, article=a, breadcrumbs=bc)
    site.write(a.url, document(site, head, body, a.category.slug), a.date)


def render_archive(site):
    bc = [("Start", "/"), ("Archiwum", "/archiwum/")]
    months = []
    for key, label, items in site.months():
        rows = "".join(f'<tr><td><time datetime="{a.iso}">{fmt_date(a.date)}</time></td><td><a href="{a.url}">{esc(a.title)}</a></td>'
                       f'<td><a class="pill" href="{a.category.url}">{esc(a.category.name)}</a></td></tr>' for a in items)
        months.append(f'<section class="arch"><h2 id="m-{key}">{label}</h2><div class="tbl"><table><thead><tr><th>Data</th><th>Tytuł</th><th>Temat</th></tr></thead><tbody>{rows}</tbody></table></div></section>')
    body = (f'<div class="container">{crumbs(bc)}<header class="sec-head"><h1>Archiwum artykułów</h1></header>'
            f'<p class="muted">Wszystkie publikacje ({len(site.articles)}) w układzie miesięcznym, od najnowszych.</p>{"".join(months)}</div>')
    head = site.head(title=f"Archiwum artykułów | {site.name}", description=f"Archiwum wszystkich artykułów serwisu {site.name} według miesięcy publikacji.",
                     url="/archiwum/", breadcrumbs=bc)
    site.write("/archiwum/", document(site, head, body, "archiwum"))
