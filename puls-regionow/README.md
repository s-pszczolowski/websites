# Puls Regionów

**„Ludzie, miejsca, sprawy codzienne”** – regionalny portal informacyjno-poradnikowy. Najwięcej miejsca poświęca Szczecinowi, Pomorzu Zachodniemu i wybrzeżu Bałtyku, ale publikuje też poradniki ogólnopolskie i teksty o innych regionach. Projekt Astro (SSG), w pełni niezależny od portali Mapa Codzienności i Horyzont Praktyczny: własna konfiguracja, komponenty, arkusz stylów (`src/styles/puls.css`), ilustracje, treści, losowanie klientów i ustawienia domeny.

## Uruchomienie

Wymagania: Node.js 18.20.8+.

```bash
npm install
npm run dev                                         # http://localhost:4321
SITE_URL=https://pulsregionow.pl npm run build      # kompilacja do dist/
npm run validate                                    # kontrola końcowa -> RAPORT-WALIDACJI.md
npm run test:browser                                # Chromium 390 px i 1280 px (Playwright)
```

`npm run build` najpierw generuje ilustracje (`scripts/generate-images.mjs`), potem buduje stronę. `pulsregionow.pl` to domena robocza użyta w testach – docelowy adres podaje się w `SITE_URL`.

## Domena

Adres ustawia wyłącznie zmienna `SITE_URL` (canonical, Open Graph, JSON-LD, sitemap, robots, RSS). Bez niej powstaje kompilacja testowa dla `http://localhost:4321` z `robots.txt` blokującym indeksowanie. Wersja produkcyjna:

```bash
SITE_URL=https://twoja-domena.pl npm run build:production
```

Polecenie sprawdza `deployment.config.json`, buduje stronę i uruchamia walidację.

## Dane do uzupełnienia przed publikacją (`deployment.config.json`)

| Pole | Zastosowanie |
|---|---|
| `wydawca.nazwa`, `wydawca.adres`, `wydawca.nip`, `wydawca.krs_regon` | Kontakt, Polityka prywatności |
| `redakcja.email`, `redakcja.email_reklama`, `redakcja.telefon` | Kontakt, Współpraca, Polityka prywatności |
| `redakcja.redaktor_naczelny` | opcjonalnie – strona O nas |
| `analityka.aktywna`, `analityka.narzedzie` | Polityka cookies |
| `daty_publikacji_potwierdzone` | potwierdzenie rzeczywistych dat publikacji |

Dopóki dane wydawcy są puste, strony Kontakt, Polityka prywatności i Cookies pokazują informację o wersji przedwdrożeniowej, strony prawne mają `noindex` i nie trafiają do sitemap, a `build:production` kończy się błędem. Portal nie zawiera żadnych wymyślonych danych właściciela, redaktorów ani adresów.

**Daty publikacji** (1.08–31.10.2026, rozkład 18/16/16, 50 różnych dni, strefa Europe/Warsaw) są demonstracyjne i zapisane na stałe w plikach artykułów. Przed publicznym uruchomieniem zastąp je rzeczywistymi datami i ustaw `daty_publikacji_potwierdzone: true`.

## Wdrożenie

Zawartość `dist/` wgraj do katalogu głównego domeny. Strona błędu: `404.html` (Apache: `ErrorDocument 404 /404.html`, Nginx: `error_page 404 /404.html;`). Adresy kończą się ukośnikiem (`/slug/` → `slug/index.html`).

## Adresy

| Typ | Schemat |
|---|---|
| Artykuł | `/slug/` |
| Dział | `/dzial/<dzial>/`, kolejne strony `/dzial/<dzial>/2/`; przegląd działów `/dzial/` |
| Wydanie regionalne | `/region/szczecin/`, `/region/pomorze-zachodnie/`, `/region/wybrzeze/`, `/region/polska/` |
| Najnowsze | `/najnowsze/`, `/najnowsze/2/` … `/najnowsze/5/` |
| Archiwum miesięczne | `/najnowsze/2026/08/` |
| Informacje | `/o-nas/`, `/kontakt/`, `/wspolpraca/`, `/artykuly-sponsorowane/`, `/polityka-prywatnosci/`, `/cookies/`, `/mapa-serwisu/` |
| Techniczne | `/sitemap.xml`, `/robots.txt`, `/rss.xml`, `/404.html` |

## Działy

| Dział | Artykuły |
|---|---:|
| Szczecin i Pomorze Zachodnie | 9 |
| Dom, remonty i nieruchomości | 8 |
| Zdrowie i specjaliści | 7 |
| Lokalny biznes i gospodarka | 7 |
| Turystyka i wypoczynek | 6 |
| Transport i motoryzacja | 5 |
| Rodzina i codzienne życie | 4 |
| Technologie i usługi | 4 |

Każdy artykuł ma też przypisane wydanie regionalne (`region`): Szczecin 12, Pomorze Zachodnie 8, Wybrzeże Bałtyku 7, Polska i inne regiony 23.

## Zasady redakcyjne

- bez wymyślonych wydarzeń lokalnych, wypowiedzi mieszkańców, wywiadów, decyzji samorządów i ekspertów (walidator wyszukuje m.in. przypisane cytaty),
- lokalne słowa kluczowe tylko tam, gdzie wynikają z tematu; teksty ogólnopolskie oznaczone wydaniem „Polska i inne regiony”,
- każdy artykuł kończy się sekcją źródeł (instytucje publiczne, akty prawne, organizacje) – adresy nie były sprawdzane na żywo z tego środowiska,
- teksty o zdrowiu i prawie mają charakter informacyjny, z zastrzeżeniami i odesłaniem do specjalisty.

## Artykuły sponsorowane

Dziesięć artykułów ma `sponsored: true` i `client: "<id>"`, etykietę „Sponsorowany” na listach, oznaczenie „Artykuł sponsorowany” w treści oraz dokładnie jeden link do klienta w środkowym akapicie z `rel="sponsored noopener"` (dodawanym automatycznie przez `src/lib/rel-links.mjs`). Linki klientów nie występują w menu, stopce ani kolumnach bocznych. Losowanie: `scripts/draw-clients.mjs` (Fisher–Yates, `crypto.randomInt`, jednakowe szanse dla wszystkich 70 firm z bazy 72 adresów); wynik, profile, obszar działania, plan artykułów i anchory – `selected-clients.json`. Ponowne losowanie wymaga `--force`.

## Struktura

```
puls-regionow/
├── astro.config.mjs              – SITE_URL, trailing slash, wtyczka rel="sponsored"
├── deployment.config.json        – dane wydawcy do uzupełnienia
├── selected-clients.json         – wynik losowania + profile, obszar działania, plan i anchory
├── public/grafika/               – ilustracje SVG (1200×750), grafiki udostępniania JPG (1200×630), logo
├── scripts/
│   ├── client-base.txt           – baza 72 adresów
│   ├── draw-clients.mjs          – losowanie klientów
│   ├── motifs.mjs, generate-images.mjs – ilustracje
│   ├── validate-content.mjs      – kontrola końcowa (treści, dist/, niezależność od poprzednich portali)
│   ├── check-deploy-config.mjs   – blokada wersji produkcyjnej bez danych wydawcy
│   └── browser-check.mjs         – test w przeglądarce
└── src/
    ├── config/portal.ts          – nazwa, hasło, działy, wydania regionalne, strony informacyjne
    ├── content.config.ts         – schemat artykułów
    ├── content/articles/*.md     – 50 artykułów
    ├── components/, layouts/     – winieta, pasek działów z menu mobilnym, karty, „Polecane”, paginacja
    ├── pages/                    – strona główna, artykuły, działy, regiony, najnowsze, sitemap, robots, RSS
    └── styles/puls.css           – projekt graficzny (styl prasowy)
```

## Nowy artykuł

1. Plik `src/content/articles/nowy-slug.md` (małe litery ASCII, myślniki).
2. Front matter:

```yaml
---
title: "Tytuł"
metaTitle: "Tytuł do wyszukiwarki (do 68 znaków)"
metaDescription: "Opis (80–160 znaków)."
lead: "Wprowadzenie."
section: "zdrowie-i-specjalisci"
region: "polska"             # szczecin | pomorze-zachodnie | wybrzeze | polska
genre: "Poradnik"
date: 2026-11-10T09:00:00+01:00
pictureAlt: "Opis ilustracji"
related: ["slug-a", "slug-b", "slug-c"]
pick: false                  # true = „Polecane przez redakcję”
residents: false             # true = „Poradniki dla mieszkańców”
sources:
  - label: "Źródło"
    url: "https://…"
---
```

3. Motyw ilustracji w `scripts/motifs.mjs` (klucz = slug) lub własny obraz w polu `picture`.
4. `npm run build && npm run validate` (przy rozbudowie zaktualizuj oczekiwane liczby w walidatorze).
