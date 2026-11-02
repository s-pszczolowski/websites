# Pięć portali redakcyjno-informacyjnych

| Katalog | Portal | Profil | Wpisy | Układ |
|---|---|---|---:|---|
| `szczecinnacodzien.pl/` | Szczecin na co dzień | portal regionalny (Szczecin, Pomorze Zachodnie) | 22 | klasyczny dziennik: winieta, pasek działów, „temat dnia”, prawa szpalta |
| `pulsprofilaktyki.pl/` | Puls Profilaktyki | portal o zdrowiu | 24 | kliniczny: kafelki tematów, karty, spis treści i bibliografia w artykule |
| `nastrojmagazyn.pl/` | Nastrój | magazyn lifestyle | 26 | magazyn: okładkowy temat numeru, asymetryczna siatka, inicjał w artykule |
| `rodzinnykompas.com.pl/` | Rodzinny Kompas | portal rodzinny | 28 | blog rodzinny: kolorowe kategorie, poziome karty, kolumna boczna, lepki spis treści |
| `wiemiwybieram.pl/` | Wiem i Wybieram | portal poradnikowo-informacyjny | 30 | baza poradników: boczna nawigacja, numerowana lista, ramka „W skrócie” |

Łącznie **130 artykułów**, każdy na własnej, jednopoziomowej podstronie (`/slug/`), z datą publikacji z okresu 1.08–31.10.2026 zapisaną na stałe w pliku treści.

## Struktura

```
build.py                  – buduje wszystkie portale (lub wybrane)
tools/sitegen.py          – wspólny silnik: Markdown → HTML, SEO, JSON-LD, sitemap, robots, RSS, paginacja
tools/art.py              – narzędzia do generowania ilustracji (każdy portal ma własny styl grafik)
tools/assign_dates.py     – jednorazowe przypisanie dat publikacji (stałe ziarno, zapis do plików)
tools/make_pages.py       – generator podstron informacyjnych (O nas, Kontakt, Polityka prywatności…)
tools/verify.py           – automatyczna kontrola końcowa, zapisuje RAPORT.md
<portal>/site.json        – nazwa, domena, kategorie, liczba wpisów na stronę
<portal>/theme.py         – szablony HTML i styl grafik danego portalu
<portal>/assets/style.css – arkusz stylów portalu
<portal>/content/*.md     – artykuły (front matter + Markdown); nazwa pliku = adres URL
<portal>/pages/*.md       – podstrony informacyjne
<portal>/public/          – GOTOWA STRONA do wgrania na hosting
```

## Wdrożenie na osobne domeny

Każdy portal jest niezależną stroną statyczną. Na serwer danej domeny wgrywasz **zawartość** katalogu `<portal>/public/` (np. przez FTP/SFTP do `public_html`). Nie jest potrzebny PHP ani baza danych.

- Adres domeny ustawia się w `site.json` (pole `url`) – od niego zależą canonical, Open Graph, sitemap i robots.txt. Po zmianie przebuduj portal.
- Strona błędu: `404.html` (w Apache: `ErrorDocument 404 /404.html`, w Nginx: `error_page 404 /404.html;`).
- Adresy kończą się ukośnikiem (`/slug/` → `slug/index.html`), co działa domyślnie na Apache, Nginx, Netlify, Cloudflare Pages i GitHub Pages.

## Budowanie i testy

Wymagania: Python 3.11+ z biblioteką Pillow; do testu przeglądarkowego Node.js z Playwright.

```bash
python3 build.py                      # wszystkie portale
python3 build.py rodzinnykompas.com.pl    # jeden portal
python3 tools/verify.py               # kontrola końcowa + RAPORT.md
```

## Artykuły partnerskie

Każdy portal zawiera dokładnie jeden artykuł z linkiem do https://wamka.pl/ i jeden do https://www.norbertszram.pl/. Są oznaczone jako materiał sponsorowany (etykieta przy tytule i ramka na początku tekstu), a linki mają `rel="sponsored noopener"`. Linki występują wyłącznie w treści tych artykułów – nie ma ich w menu, stopkach ani kolumnach bocznych. Szczegóły i adresy: `RAPORT.md`.
