"""Nastrój – nowoczesny magazyn lifestyle.

Układ: centralna winieta z szeryfowym logotypem, menu „hamburger” (checkbox)
na telefonie, okładkowy „temat numeru”, pasek numerowanych rubryk,
asymetryczna siatka magazynowa, artykuł z inicjałem i szerokim zdjęciem.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from art import Image, ImageDraw, rng, mix, save, logo_png, font, hex2rgb  # noqa: E402
from sitegen import esc, fmt_date, MONTHS_GEN  # noqa: E402

CREAM, INK, TERRA = "#f6f1ea", "#1d1a17", "#b5532f"
PALETTE = ["#b5532f", "#e0a458", "#7d8b6a", "#e8c4b8", "#2f4858", "#d98c6a", "#a3b18a", "#f2d6a2"]


# ------------------------------------------------------------- grafika

def make_image(site, a, path, size):
    r = rng("nastroj-" + a.slug)
    w, h = size
    bg = r.choice(["#f6f1ea", "#efe6da", "#f3e9e1", "#e9ecdf"])
    img = Image.new("RGB", size, hex2rgb(bg))
    d = ImageDraw.Draw(img, "RGBA")
    cols = r.sample(PALETTE, 4)
    # duże bloki i łuki w stylu kolażu
    x0 = r.uniform(-.1, .4) * w
    d.rectangle([x0, r.uniform(.3, .6) * h, x0 + r.uniform(.3, .6) * w, h], fill=hex2rgb(cols[0]))
    cx, cy, rad = r.uniform(.4, .9) * w, r.uniform(.2, .6) * h, r.uniform(.18, .32) * w
    d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=hex2rgb(cols[1]))
    ax, ay, ar = r.uniform(0, .5) * w, r.uniform(0, .4) * h, r.uniform(.15, .28) * w
    d.pieslice([ax - ar, ay - ar, ax + ar, ay + ar], r.choice([0, 90, 180, 270]), 0 + r.choice([180, 270]), fill=hex2rgb(cols[2]))
    for _ in range(r.randint(2, 4)):
        sx, sy = r.uniform(0, w), r.uniform(0, h)
        sr = r.uniform(.02, .05) * w
        d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(*hex2rgb(cols[3]), 230))
    # cienkie linie
    for i in range(r.randint(3, 6)):
        y = r.uniform(.05, .95) * h
        d.line([(r.uniform(0, .5) * w, y), (r.uniform(.5, 1) * w, y)], fill=(*hex2rgb(INK), 90), width=max(1, w // 500))
    # ziarno
    noise = Image.effect_noise(size, 18).convert("RGB")
    img = Image.blend(img, noise, .06)
    save(img, path, quality=80)


def make_static(site):
    out = site.out
    (out / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#f6f1ea"/>'
        '<circle cx="40" cy="26" r="16" fill="#e0a458"/><text x="30" y="50" font-family="Georgia,serif" font-style="italic" '
        'font-size="44" fill="#1d1a17" text-anchor="middle">N</text></svg>', encoding="utf-8")
    logo_png(out / "logo.png", [("Nastrój", INK, 120, "DejaVuSerif-Bold.ttf"), ("magazyn o codzienności", TERRA, 34, "DejaVuSans.ttf")], CREAM)
    img = Image.new("RGB", (1200, 675), hex2rgb(CREAM))
    d = ImageDraw.Draw(img)
    d.ellipse([760, 80, 1140, 460], fill=hex2rgb("#e0a458"))
    d.rectangle([0, 470, 520, 675], fill=hex2rgb(TERRA))
    d.text((90, 210), "Nastrój", font=font("DejaVuSerif-Bold.ttf", 150), fill=INK)
    d.text((96, 395), "magazyn o codzienności", font=font("DejaVuSans.ttf", 40), fill=INK)
    save(img, out / "img" / "og-default.jpg")


# ------------------------------------------------------------- fragmenty

def nav_items(site, current):
    items = []
    for c in site.categories.values():
        cur = ' aria-current="page"' if current == c.slug else ""
        items.append(f'<li><a href="{c.url}"{cur}>{esc(c.name)}</a></li>')
    cur = ' aria-current="page"' if current == "archiwum" else ""
    items.append(f'<li><a href="/archiwum/"{cur}>Archiwum</a></li>')
    return "".join(items)


def header(site, current):
    return f"""<a class="skip" href="#content">Przejdź do treści</a>
<header class="masthead">
<p class="mast-top">magazyn o codzienności</p>
<a class="wordmark" href="/" aria-label="Nastrój – strona główna">Nastrój<span aria-hidden="true">.</span></a>
<input type="checkbox" id="menu-toggle" class="menu-toggle" aria-label="Pokaż menu">
<label for="menu-toggle" class="burger" aria-hidden="true"><span></span><span></span><span></span></label>
<nav class="menu" aria-label="Rubryki"><ul>{nav_items(site, current)}</ul></nav>
</header>"""


def footer(site):
    cats = "".join(f'<li><a href="{c.url}">{esc(c.name)}</a></li>' for c in site.categories.values())
    pages = "".join(f'<li><a href="{p.url}">{esc(p.title)}</a></li>' for p in site.pages)
    return f"""<footer class="colophon">
<div class="colo-word">Nastrój<span>.</span></div>
<div class="colo-cols"><div><h2>Rubryki</h2><ul>{cats}</ul></div>
<div><h2>Magazyn</h2><ul>{pages}<li><a href="/archiwum/">Wszystkie teksty</a></li></ul></div>
<div><h2>O nas</h2><p>{esc(site.config["tagline"])}</p><p class="fine">Teksty o zdrowiu mają charakter ogólny i nie zastępują porady specjalisty.</p></div></div>
<p class="fine">© 2026 Nastrój · magazyn internetowy</p>
</footer>"""


def document(site, head, body, current="", cls=""):
    return f"""<!doctype html>
<html lang="pl">
<head>
{head}
</head>
<body class="{cls}">
{header(site, current)}
<main id="content">
{body}
</main>
{footer(site)}
</body>
</html>"""


def pic(a, eager=False, sizes="(max-width: 800px) 100vw, 50vw"):
    load = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return (f'<img src="{a.image_small}" srcset="{a.image_small} 640w, {a.image} 1200w" sizes="{sizes}" '
            f'width="640" height="360" alt="Kolaż graficzny do tekstu „{esc(a.title)}”" {load}>')


def short_date(d):
    return f"{d.day} {MONTHS_GEN[d.month - 1]}"


def label(a):
    s = f'<a class="rubric" href="{a.category.url}">{esc(a.category.name)}</a>'
    if a.sponsored:
        s += '<span class="promo">Materiał promocyjny</span>'
    return s


def tile(a, size="s"):
    return f"""<article class="tile tile-{size}">
<a class="tile-img" href="{a.url}" tabindex="-1" aria-hidden="true">{pic(a)}</a>
<div class="tile-body">{label(a)}
<h3><a href="{a.url}">{esc(a.title)}</a></h3>
<p class="tile-lead">{esc(a.lead)}</p>
<p class="byline"><time datetime="{a.iso}">{fmt_date(a.date)}</time></p></div>
</article>"""


def pager(p):
    if p.total == 1:
        return ""
    prev = f'<a class="pg-arrow" href="{p.prev_url}" rel="prev">← nowsze</a>' if p.prev_url else '<span class="pg-arrow off">← nowsze</span>'
    nxt = f'<a class="pg-arrow" href="{p.next_url}" rel="next">starsze →</a>' if p.next_url else '<span class="pg-arrow off">starsze →</span>'
    nums = "".join(f'<span class="pg-num on" aria-current="page">{i:02d}</span>' if i == p.number else f'<a class="pg-num" href="{u}">{i:02d}</a>'
                   for i, u in enumerate(p.urls, 1))
    return f'<nav class="pg" aria-label="Strony">{prev}<span class="pg-nums">{nums}</span>{nxt}</nav>'


def crumbs(items):
    out = []
    for i, (n, u) in enumerate(items):
        out.append(f'<li><a href="{u}">{esc(n)}</a></li>' if i < len(items) - 1 else f'<li aria-current="page">{esc(n)}</li>')
    return f'<nav class="trail" aria-label="Jesteś tutaj"><ol>{"".join(out)}</ol></nav>'


# ------------------------------------------------------------- strony

def render_all(site):
    per = site.config["per_page"]
    feat = site.featured()
    for p in site.paginate(site.articles, per, "/"):
        if p.number == 1:
            render_home(site, feat, p)
            continue
        body = (f'<header class="sheet-head"><p class="kicker">Wszystkie teksty</p><h1>Więcej do czytania <em>— strona {p.number}</em></h1></header>'
                f'<section class="mag-grid">{"".join(tile(a, "s") for a in p.items)}</section>{pager(p)}')
        head = site.head(title=f"Więcej do czytania – strona {p.number} | {site.name}",
                         description=f"Teksty magazynu {site.name} o relacjach, zdrowiu, urodzie i codzienności – strona {p.number} z {p.total}.",
                         url=p.url, prev_url=p.prev_url, next_url=p.next_url)
        site.write(p.url, document(site, head, body))
    order = list(site.categories)
    for idx, c in enumerate(site.categories.values(), 1):
        if not c.articles:
            continue
        for p in site.paginate(c.articles, per, c.url):
            bc = [("Nastrój", "/"), (c.name, c.url)]
            sfx = f" — strona {p.number}" if p.number > 1 else ""
            body = (f'<header class="sheet-head rubric-head"><span class="big-num" aria-hidden="true">{idx:02d}</span>{crumbs(bc)}'
                    f'<p class="kicker">Rubryka</p><h1>{esc(c.name)}<em>{sfx}</em></h1><p class="sheet-desc">{esc(c.description)}</p></header>'
                    f'<section class="mag-grid">{"".join(tile(a, "l" if (i == 0 and p.number == 1) else "s") for i, a in enumerate(p.items))}</section>{pager(p)}')
            head = site.head(title=f"{c.name}{sfx} – rubryka magazynu {site.name}",
                             description=f"{c.description} Rubryka {c.name} w magazynie {site.name}."[:160], url=p.url,
                             prev_url=p.prev_url, next_url=p.next_url, breadcrumbs=bc)
            site.write(p.url, document(site, head, body, c.slug))
    for a in site.articles:
        render_article(site, a)
    render_archive(site)
    for pg in site.pages:
        bc = [("Nastrój", "/"), (pg.title, pg.url)]
        body = f'<article class="essay static">{crumbs(bc)}<h1>{esc(pg.title)}</h1><div class="essay-body">{pg.body_html}</div></article>'
        site.write(pg.url, document(site, site.head(title=f"{pg.title} | {site.name}", description=pg.description,
                                                    url=pg.url, breadcrumbs=bc), body))
    head = site.head(title=f"Zgubiliśmy tę stronę | {site.name}", description="Strona nie istnieje.", url="/404.html", noindex=True)
    body = ('<article class="essay static"><h1>Tej strony tu nie ma</h1><div class="essay-body"><p>Być może tekst zmienił adres. '
            'Zajrzyj na <a href="/">stronę główną</a> albo do <a href="/archiwum/">archiwum</a>.</p></div></article>')
    (site.out / "404.html").write_text(document(site, head, body), encoding="utf-8")


def render_home(site, feat, p):
    rest = [a for a in p.items if a is not feat]
    rubrics = "".join(f'<li><a href="{c.url}"><span class="n">{i:02d}</span><span class="t">{esc(c.name)}</span>'
                      f'<span class="c">{len(c.articles)} tekstów</span></a></li>' for i, c in enumerate(site.categories.values(), 1))
    sizes = ["l", "s", "s", "m", "m", "s", "s", "s", "l", "s"]
    grid = "".join(tile(a, sizes[i % len(sizes)]) for i, a in enumerate(rest))
    sections = []
    for i, c in enumerate(site.categories.values()):
        if len(c.articles) < 2:
            continue
        first, others = c.articles[0], c.articles[1:4]
        lis = "".join(f'<li><a href="{a.url}">{esc(a.title)}</a><span>{short_date(a.date)}</span></li>' for a in others)
        sections.append(f"""<section class="rub-block {'flip' if i % 2 else ''}">
<a class="rub-img" href="{first.url}" tabindex="-1" aria-hidden="true">{pic(first)}</a>
<div class="rub-txt"><p class="kicker"><a href="{c.url}">{esc(c.name)}</a></p><h3><a href="{first.url}">{esc(first.title)}</a></h3>
<p>{esc(first.lead)}</p><ul class="rub-list">{lis}</ul><a class="more" href="{c.url}">Cała rubryka {esc(c.name)} →</a></div></section>""")
    body = f"""<h1 class="sr">Nastrój – magazyn o codzienności, relacjach i dbaniu o siebie</h1>
<section class="cover" aria-label="Temat numeru">
<a class="cover-img" href="{feat.url}" tabindex="-1" aria-hidden="true">{pic(feat, True, "(max-width: 900px) 100vw, 60vw")}</a>
<div class="cover-txt"><p class="kicker">Temat numeru</p>{label(feat)}
<h2><a href="{feat.url}">{esc(feat.title)}</a></h2><p class="cover-lead">{esc(feat.lead)}</p>
<p class="byline"><time datetime="{feat.iso}">{fmt_date(feat.date)}</time> · {feat.reading_minutes} min lektury</p>
<a class="btn" href="{feat.url}">Czytaj tekst</a></div>
</section>
<nav class="rubrics" aria-label="Rubryki magazynu"><ul>{rubrics}</ul></nav>
<section aria-labelledby="nowe-h"><header class="sec"><h2 id="nowe-h">Nowe w magazynie</h2><a href="/archiwum/">Wszystkie teksty</a></header>
<div class="mag-grid">{grid}</div>{pager(p)}</section>
<section class="rub-blocks" aria-labelledby="rub-h"><header class="sec"><h2 id="rub-h">Z rubryk</h2></header>{"".join(sections)}</section>"""
    head = site.head(title=f"{site.name} – magazyn o codzienności, relacjach, zdrowiu i urodzie",
                     description="Magazyn lifestyle o codziennym życiu: relacje, zdrowie, uroda, dom i rozwój osobisty. Teksty pisane z uważnością, bez presji i obietnic cudów.",
                     url="/", next_url=p.next_url, extra_ld=site.website_ld())
    site.write("/", document(site, head, body, "home", "home"))


def render_article(site, a):
    bc = [("Nastrój", "/"), (a.category.name, a.category.url), (a.title, a.url)]
    rel = site.related(a, 3)
    newer, older = site.neighbours(a)
    promo = ""
    if a.sponsored:
        promo = ('<p class="promo-note">Materiał promocyjny przygotowany we współpracy z partnerem. Tekst zawiera link sponsorowany. '
                 'Informacje mają charakter ogólny i nie zastępują konsultacji ze specjalistą.</p>')
    src = ""
    if a.sources:
        lis = []
        for s in a.sources:
            n, _, u = s.partition("|")
            lis.append(f'<li><a href="{esc(u.strip())}" rel="noopener noreferrer">{esc(n.strip())}</a></li>' if u.strip() else f"<li>{esc(n)}</li>")
        src = f'<aside class="sources"><h2>Źródła i polecane lektury</h2><ul>{"".join(lis)}</ul></aside>'
    turn = '<nav class="turn" aria-label="Przewracaj strony">'
    turn += f'<a href="{older.url}"><small>poprzedni tekst</small>{esc(older.title)}</a>' if older else "<span></span>"
    turn += f'<a href="{newer.url}"><small>następny tekst</small>{esc(newer.title)}</a>' if newer else "<span></span>"
    turn += "</nav>"
    body = f"""<article class="essay">
<header class="essay-head">{crumbs(bc)}<div class="labels">{label(a)}</div>
<h1>{esc(a.title)}</h1><p class="standfirst">{esc(a.lead)}</p>
<p class="byline">Tekst: redakcja Nastroju · <time datetime="{a.iso}">{fmt_date(a.date)}</time> · {a.reading_minutes} min lektury</p></header>
<figure class="essay-fig">{pic(a, True, "(max-width: 1100px) 100vw, 1100px")}</figure>
{promo}
<div class="essay-body dropcap">{a.body_html}</div>
{src}
{turn}
</article>
<section class="next-read" aria-labelledby="dalej-h"><header class="sec"><h2 id="dalej-h">Czytaj dalej</h2></header><div class="mag-grid three">{"".join(tile(r, "s") for r in rel)}</div></section>"""
    head = site.head(title=f"{a.seo_title or a.title} | {site.name}", description=a.description, url=a.url,
                     og_type="article", image=a.image, article=a, breadcrumbs=bc)
    site.write(a.url, document(site, head, body, a.category.slug), a.date)


def render_archive(site):
    bc = [("Nastrój", "/"), ("Archiwum", "/archiwum/")]
    blocks = []
    for key, lab, items in site.months():
        lis = "".join(f'<li><span class="d">{a.date.day:02d}</span><a href="{a.url}">{esc(a.title)}</a><a class="rubric" href="{a.category.url}">{esc(a.category.name)}</a></li>' for a in items)
        blocks.append(f'<section class="arch-m" id="m-{key}"><h2>{lab}</h2><ol>{lis}</ol></section>')
    body = (f'<header class="sheet-head">{crumbs(bc)}<p class="kicker">Archiwum</p><h1>Wszystkie teksty</h1>'
            f'<p class="sheet-desc">{len(site.articles)} tekstów magazynu ułożonych według miesięcy.</p></header><div class="arch">{"".join(blocks)}</div>')
    head = site.head(title=f"Archiwum tekstów | {site.name}", description=f"Archiwum magazynu {site.name}: wszystkie teksty według miesięcy publikacji.",
                     url="/archiwum/", breadcrumbs=bc)
    site.write("/archiwum/", document(site, head, body, "archiwum"))
