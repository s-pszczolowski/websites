"""Wiem i Wybieram – rozbudowany blog poradnikowy.

Układ: stała ciemna kolumna nawigacji po lewej (na telefonie zwijany pasek
z <details>), „poradnik tygodnia”, numerowana lista najnowszych poradników,
tabelaryczne zestawienie działów, artykuł z ramką „W skrócie” i spisem
treści w prawej kolumnie.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from art import Image, ImageDraw, rng, mix, save, logo_png, font, hex2rgb, linear_gradient  # noqa: E402
from sitegen import esc, fmt_date, fmt_date_short  # noqa: E402

NAVY, BLUE, LIME, PAPER = "#1e3a8a", "#2563eb", "#a3e635", "#f4f6fb"
CHECK = ('<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#a3e635"/>'
         '<path d="M8 16.5l5 5L24 10" fill="none" stroke="#1e3a8a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')


def shorts(site):
    return {c["slug"]: c.get("short", c["slug"][:2].upper()) for c in site.config["categories"]}


# ------------------------------------------------------------- grafika

def make_image(site, a, path, size):
    r = rng("wiw:" + a.slug)
    w, h = size
    tints = {"zdrowie": "#0f766e", "specjalisci": "#1e3a8a", "konsument": "#7c2d12", "finanse": "#365314",
             "dom": "#334155", "swiadome-wybory": "#4c1d95"}
    deep = tints.get(a.category.slug, NAVY)
    img = linear_gradient(size, deep, mix(deep, "#000000", .35), vertical=False).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    step = w / 24
    for i in range(25):  # siatka „planu”
        d.line([(i * step, 0), (i * step, h)], fill=(255, 255, 255, 22), width=1)
    for j in range(int(h / step) + 1):
        d.line([(0, j * step), (w, j * step)], fill=(255, 255, 255, 22), width=1)
    # słupki / kafelki
    n = r.randint(4, 7)
    base = h * .82
    for k in range(n):
        x0 = w * .08 + k * (w * .62 / n)
        bh = r.uniform(.15, .55) * h
        col = (*hex2rgb(LIME), 230) if k == r.randrange(n) else (255, 255, 255, r.randint(60, 140))
        d.rounded_rectangle([x0, base - bh, x0 + w * .62 / n * .7, base], radius=int(w / 160), fill=col)
    # okrąg z „ptaszkiem”
    cx, cy, rad = w * r.uniform(.74, .84), h * r.uniform(.3, .45), w * .11
    d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=(*hex2rgb(LIME), 255), width=max(3, w // 120))
    d.line([(cx - rad * .45, cy), (cx - rad * .1, cy + rad * .35), (cx + rad * .5, cy - rad * .35)],
           fill=(*hex2rgb(LIME), 255), width=max(4, w // 90), joint="curve")
    save(img, path)


def make_static(site):
    out = site.out
    (out / "favicon.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' + CHECK[CHECK.index(">") + 1:], encoding="utf-8")
    logo_png(out / "logo.png", [("wiem i", "#ffffff", 80, "DejaVuSans.ttf"), ("wybieram", LIME, 96, "DejaVuSans-Bold.ttf")], NAVY)
    img = linear_gradient((1200, 675), NAVY, "#0b1640", vertical=False)
    d = ImageDraw.Draw(img)
    d.text((90, 220), "wiem i", font=font("DejaVuSans.ttf", 100), fill="#ffffff")
    d.text((90, 340), "wybieram", font=font("DejaVuSans-Bold.ttf", 130), fill=LIME)
    save(img, out / "img" / "og-default.jpg")


# ------------------------------------------------------------- fragmenty

def nav(site, current):
    sh = shorts(site)
    items = [f'<li><a href="/"{" aria-current=\"page\"" if current == "home" else ""}><span class="tag">⌂</span>Start</a></li>']
    for c in site.categories.values():
        cur = ' aria-current="page"' if current == c.slug else ""
        items.append(f'<li><a href="{c.url}"{cur}><span class="tag">{esc(sh[c.slug])}</span>{esc(c.name)}<em>{len(c.articles)}</em></a></li>')
    cur = ' aria-current="page"' if current == "archiwum" else ""
    items.append(f'<li><a href="/archiwum/"{cur}><span class="tag">A–Z</span>Wszystkie poradniki</a></li>')
    return "".join(items)


def shell(site, current):
    links = nav(site, current)
    pages = "".join(f'<li><a href="{p.url}">{esc(p.title)}</a></li>' for p in site.pages)
    return f"""<a class="skip" href="#main">Przejdź do treści</a>
<aside class="rail" aria-label="Nawigacja serwisu">
<a class="brand" href="/" aria-label="Wiem i Wybieram – strona główna">{CHECK}<span>wiem i <b>wybieram</b></span></a>
<p class="rail-claim">Praktyczna wiedza do codziennych decyzji</p>
<nav aria-label="Działy"><ul class="rail-nav">{links}</ul></nav>
<ul class="rail-pages">{pages}</ul>
</aside>
<header class="mbar"><a class="brand" href="/" aria-label="Wiem i Wybieram – strona główna">{CHECK}<span>wiem i <b>wybieram</b></span></a>
<details class="mnav"><summary>Działy</summary><nav aria-label="Działy (telefon)"><ul class="rail-nav">{links}</ul></nav></details></header>"""


def footer(site):
    pages = " · ".join(f'<a href="{p.url}">{esc(p.title)}</a>' for p in site.pages)
    return f"""<footer class="foot"><p><strong>Wiem i Wybieram</strong> – {esc(site.config["tagline"])}</p>
<p class="links">{pages} · <a href="/archiwum/">Wszystkie poradniki</a> · <a href="/sitemap.xml">Mapa strony</a> · <a href="/feed.xml">RSS</a></p>
<p class="small">Poradniki mają charakter informacyjny i nie stanowią porady medycznej, prawnej ani finansowej w indywidualnej sprawie. © 2026 Wiem i Wybieram</p></footer>"""


def document(site, head, body, current=""):
    return f"""<!doctype html>
<html lang="pl">
<head>
{head}
</head>
<body>
{shell(site, current)}
<div class="page">
<main id="main">
{body}
</main>
{footer(site)}
</div>
</body>
</html>"""


def thumb(a, eager=False, sizes="(max-width: 700px) 100vw, 220px"):
    load = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return (f'<img src="{a.image_small}" srcset="{a.image_small} 640w, {a.image} 1200w" sizes="{sizes}" width="640" height="360" '
            f'alt="Grafika poradnika: {esc(a.title)}" {load}>')


def meta_line(site, a):
    sp = ' <span class="sp">Materiał sponsorowany</span>' if a.sponsored else ""
    return (f'<p class="meta"><a class="cat" href="{a.category.url}">{esc(a.category.name)}</a>'
            f'<span class="form">{esc(a.form or "poradnik")}</span><time datetime="{a.iso}">{fmt_date(a.date)}</time>{sp}</p>')


def item(site, a, n):
    return f"""<li class="item"><span class="num" aria-hidden="true">{n:02d}</span>
<div class="item-txt">{meta_line(site, a)}<h3><a href="{a.url}">{esc(a.title)}</a></h3><p>{esc(a.lead)}</p></div>
<a class="item-img" href="{a.url}" tabindex="-1" aria-hidden="true">{thumb(a)}</a></li>"""


def pager(p):
    if p.total == 1:
        return ""
    s = ['<nav class="pages" aria-label="Kolejne strony listy">']
    s.append(f'<a href="{p.prev_url}" rel="prev">← Nowsze</a>' if p.prev_url else '<span class="off">← Nowsze</span>')
    s.append('<ol>' + "".join(f'<li><span class="cur" aria-current="page">{i}</span></li>' if i == p.number else f'<li><a href="{u}">{i}</a></li>'
                              for i, u in enumerate(p.urls, 1)) + '</ol>')
    s.append(f'<a href="{p.next_url}" rel="next">Starsze →</a>' if p.next_url else '<span class="off">Starsze →</span>')
    s.append("</nav>")
    return "".join(s)


def crumbs(items):
    out = []
    for i, (n, u) in enumerate(items):
        out.append(f'<li><a href="{u}">{esc(n)}</a></li>' if i < len(items) - 1 else f'<li aria-current="page">{esc(n)}</li>')
    return f'<nav class="crumbs" aria-label="Ścieżka nawigacji"><ol>{"".join(out)}</ol></nav>'


# ------------------------------------------------------------- strony

def render_all(site):
    per = site.config["per_page"]
    feat = site.featured()
    for p in site.paginate(site.articles, per, "/"):
        if p.number == 1:
            render_home(site, feat, p)
            continue
        start = (p.number - 1) * per
        body = (f'<header class="head"><p class="kick">Lista poradników</p><h1>Wszystkie poradniki – strona {p.number} z {p.total}</h1></header>'
                f'<ol class="list">{"".join(item(site, a, start + i + 1) for i, a in enumerate(p.items))}</ol>{pager(p)}')
        head = site.head(title=f"Poradniki – strona {p.number} | {site.name}",
                         description=f"Praktyczne poradniki serwisu {site.name}: zdrowie, specjaliści, prawa konsumenta i finanse – strona {p.number} z {p.total}.",
                         url=p.url, prev_url=p.prev_url, next_url=p.next_url)
        site.write(p.url, document(site, head, body))
    for c in site.categories.values():
        if not c.articles:
            continue
        for p in site.paginate(c.articles, per, c.url):
            bc = [("Start", "/"), (c.name, c.url)]
            sfx = f" – strona {p.number}" if p.number > 1 else ""
            start = (p.number - 1) * per
            body = (f'{crumbs(bc)}<header class="head"><p class="kick">Dział</p><h1>{esc(c.name)}{sfx}</h1><p class="desc">{esc(c.description)}</p>'
                    f'<p class="stat"><b>{len(c.articles)}</b> poradników w dziale</p></header>'
                    f'<ol class="list">{"".join(item(site, a, start + i + 1) for i, a in enumerate(p.items))}</ol>{pager(p)}')
            head = site.head(title=f"{c.name}{sfx} – poradniki | {site.name}",
                             description=f"{c.description} Dział {c.name} w serwisie {site.name}."[:160], url=p.url,
                             prev_url=p.prev_url, next_url=p.next_url, breadcrumbs=bc)
            site.write(p.url, document(site, head, body, c.slug))
    for a in site.articles:
        render_article(site, a)
    render_archive(site)
    for pg in site.pages:
        bc = [("Start", "/"), (pg.title, pg.url)]
        body = f'{crumbs(bc)}<article class="doc static"><h1>{esc(pg.title)}</h1><div class="body">{pg.body_html}</div></article>'
        site.write(pg.url, document(site, site.head(title=f"{pg.title} | {site.name}", description=pg.description,
                                                    url=pg.url, breadcrumbs=bc), body))
    head = site.head(title=f"Nie ma takiej strony | {site.name}", description="Strona nie istnieje.", url="/404.html", noindex=True)
    body = ('<article class="doc static"><h1>Nie znaleźliśmy tej strony</h1><div class="body"><p>Sprawdź adres lub przejdź do '
            '<a href="/">strony startowej</a> albo <a href="/archiwum/">listy wszystkich poradników</a>.</p></div></article>')
    (site.out / "404.html").write_text(document(site, head, body), encoding="utf-8")


def render_home(site, feat, p):
    sh = shorts(site)
    rows = []
    for c in site.categories.values():
        if not c.articles:
            continue
        top = "".join(f'<li><a href="{a.url}">{esc(a.title)}</a></li>' for a in c.articles[:3])
        rows.append(f'<tr><th scope="row"><a href="{c.url}"><span class="tag">{esc(sh[c.slug])}</span>{esc(c.name)}</a>'
                    f'<small>{esc(c.description)}</small></th><td><ul>{top}</ul></td><td class="n"><a href="{c.url}">{len(c.articles)} →</a></td></tr>')
    body = f"""<header class="hello"><h1>Wiem i wybieram – praktyczne poradniki do codziennych decyzji</h1>
<p>Zdrowie, wybór specjalisty, reklamacje, domowy budżet i bezpieczny dom. Krótko, konkretnie, z listami kontrolnymi i źródłami.</p></header>
<section class="feature" aria-labelledby="pt-h">
<a class="feature-img" href="{feat.url}" tabindex="-1" aria-hidden="true">{thumb(feat, True, "(max-width: 900px) 100vw, 520px")}</a>
<div class="feature-txt"><p class="kick" id="pt-h">Poradnik tygodnia</p>{meta_line(site, feat)}
<h2><a href="{feat.url}">{esc(feat.title)}</a></h2><p>{esc(feat.lead)}</p>
<a class="go" href="{feat.url}">Przejdź do poradnika →</a></div></section>
<section aria-labelledby="nowe-h"><header class="sec"><h2 id="nowe-h">Najnowsze poradniki</h2><a href="/archiwum/">Wszystkie A–Z</a></header>
<ol class="list">{"".join(item(site, a, i + 1) for i, a in enumerate(p.items))}</ol>{pager(p)}</section>
<section aria-labelledby="dzialy-h"><header class="sec"><h2 id="dzialy-h">Działy tematyczne</h2></header>
<div class="tbl"><table class="depts"><thead><tr><th scope="col">Dział</th><th scope="col">Ostatnio dodane</th><th scope="col">Poradniki</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div></section>"""
    head = site.head(title=f"{site.name} – praktyczne poradniki: zdrowie, specjaliści, konsument, finanse",
                     description="Poradniki krok po kroku: jak przygotować się do wizyty u specjalisty, złożyć reklamację, ułożyć budżet i podejmować świadome wybory.",
                     url="/", next_url=p.next_url, extra_ld=site.website_ld())
    site.write("/", document(site, head, body, "home"))


def render_article(site, a):
    bc = [("Start", "/"), (a.category.name, a.category.url), (a.title, a.url)]
    toc = "".join(f'<li><a href="#{hid}">{esc(t)}</a></li>' for hid, t in a.toc)
    summary = "".join(f"<li>{esc(t)}</li>" for _, t in a.toc[:5])
    rel = site.related(a, 4)
    newer, older = site.neighbours(a)
    sp = ""
    if a.sponsored:
        sp = ('<div class="notice"><strong>Materiał sponsorowany.</strong> Poradnik przygotowany we współpracy z partnerem; '
              'zawiera link sponsorowany oznaczony atrybutem rel="sponsored". Treść ma charakter informacyjny.</div>')
    src = ""
    if a.sources:
        lis = []
        for s in a.sources:
            n, _, u = s.partition("|")
            lis.append(f'<li><a href="{esc(u.strip())}" rel="noopener noreferrer">{esc(n.strip())}</a></li>' if u.strip() else f"<li>{esc(n)}</li>")
        src = f'<section class="refs"><h2>Podstawa informacji i źródła</h2><ol>{"".join(lis)}</ol></section>'
    nb = '<nav class="nb" aria-label="Sąsiednie poradniki">'
    nb += f'<a href="{older.url}"><span>Poprzedni poradnik</span>{esc(older.title)}</a>' if older else "<span></span>"
    nb += f'<a href="{newer.url}"><span>Następny poradnik</span>{esc(newer.title)}</a>' if newer else "<span></span>"
    nb += "</nav>"
    rel_html = "".join(f'<li><a href="{r.url}">{esc(r.title)}</a><small>{esc(r.category.name)} · {fmt_date_short(r.date)}</small></li>' for r in rel)
    body = f"""{crumbs(bc)}
<div class="art-grid">
<article class="doc">
<header>{meta_line(site, a)}<h1>{esc(a.title)}</h1><p class="lead">{esc(a.lead)}</p>
<p class="by">Opracowanie: redakcja Wiem i Wybieram · {a.reading_minutes} min czytania</p></header>
<figure class="fig">{thumb(a, True, "(max-width: 900px) 100vw, 720px")}</figure>
{sp}
<section class="tldr" aria-label="W skrócie"><h2>W skrócie – z tego poradnika dowiesz się:</h2><ul>{summary}</ul></section>
<div class="body">{a.body_html}</div>
{src}
{nb}
</article>
<aside class="aside"><div class="stick">
<nav class="box" aria-label="Spis treści"><h2>Spis treści</h2><ol>{toc}</ol></nav>
<section class="box"><h2>Powiązane poradniki</h2><ul class="rel">{rel_html}</ul></section>
</div></aside>
</div>"""
    head = site.head(title=f"{a.seo_title or a.title} | {site.name}", description=a.description, url=a.url,
                     og_type="article", image=a.image, article=a, breadcrumbs=bc)
    site.write(a.url, document(site, head, body, a.category.slug), a.date)


def render_archive(site):
    bc = [("Start", "/"), ("Wszystkie poradniki", "/archiwum/")]
    alpha = sorted(site.articles, key=lambda a: a.title.lower())
    rows = "".join(f'<tr><td><a href="{a.url}">{esc(a.title)}</a></td><td><a href="{a.category.url}">{esc(a.category.name)}</a></td>'
                   f'<td><time datetime="{a.iso}">{fmt_date_short(a.date)}</time></td></tr>' for a in alpha)
    months = "".join(f'<li><a href="#m-{k}">{lab}</a> ({len(it)})</li>' for k, lab, it in site.months())
    chrono = "".join(f'<section id="m-{k}"><h2>{lab}</h2><ul class="chron">' + "".join(
        f'<li><time datetime="{a.iso}">{fmt_date_short(a.date)}</time> <a href="{a.url}">{esc(a.title)}</a></li>' for a in it) + "</ul></section>"
        for k, lab, it in site.months())
    body = (f'{crumbs(bc)}<header class="head"><p class="kick">Archiwum</p><h1>Wszystkie poradniki</h1>'
            f'<p class="desc">{len(site.articles)} poradników – alfabetycznie i według miesięcy publikacji.</p><ul class="jump">{months}</ul></header>'
            f'<div class="tbl"><table class="az"><thead><tr><th scope="col">Tytuł (A–Z)</th><th scope="col">Dział</th><th scope="col">Data</th></tr></thead><tbody>{rows}</tbody></table></div>'
            f'<div class="chrono">{chrono}</div>')
    head = site.head(title=f"Wszystkie poradniki A–Z | {site.name}",
                     description=f"Pełna lista poradników serwisu {site.name}: alfabetycznie i według miesięcy publikacji.",
                     url="/archiwum/", breadcrumbs=bc)
    site.write("/archiwum/", document(site, head, body, "archiwum"))
