# Horyzont Praktyczny

**„Pomysły, rozwiązania, perspektywy”** – ogólnopolski portal poradnikowo-informacyjny o technologiach, gospodarce, nieruchomościach, zdrowiu, transporcie, turystyce, finansach i prawie oraz stylu życia. Projekt Astro (SSG), niezależny od portalu Mapa Codzienności: własna konfiguracja, komponenty, arkusz stylów, ilustracje, treści i losowanie klientów.

## Uruchomienie

Wymagania: Node.js 18.20.8+.

```bash
npm install
npm run dev                                             # http://localhost:4321
SITE_URL=https://horyzontpraktyczny.pl npm run build    # kompilacja do dist/
npm run validate                                        # kontrola końcowa -> RAPORT-WALIDACJI.md
npm run test:browser                                    # Chromium 390 px i 1280 px (Playwright)
```

`npm run build` najpierw generuje ilustracje (`scripts/generate-images.mjs`), potem buduje stronę.

## Domena

Adres ustawia wyłącznie zmienna `SITE_URL` (canonical, Open Graph, JSON-LD, sitemap, robots, RSS). Bez niej powstaje kompilacja testowa dla `http://localhost:4321` z `robots.txt` blokującym indeksowanie. Wersja produkcyjna:

```bash
SITE_URL=https://twojadomena.pl npm run build:production
```

Polecenie sprawdza `deployment.config.json`, buduje stronę i uruchamia walidację.

## Dane do uzupełnienia przed publikacją (`deployment.config.json`)

| Pole | Zastosowanie |
|---|---|
| `wydawca.nazwa`, `wydawca.adres`, `wydawca.nip`, `wydawca.krs_lub_regon` | Kontakt, Polityka prywatności |
| `kontakt.email`, `kontakt.email_wspolpraca`, `kontakt.telefon` | Kontakt, Polityka prywatności |
| `odpowiedzialny_za_tresci` | opcjonalnie – strona O portalu |
| `analityka.wlaczona`, `analityka.narzedzie` | Polityka cookies |
| `daty_publikacji_zweryfikowane` | potwierdzenie rzeczywistych dat publikacji |

Dopóki dane wydawcy są puste, strony Kontakt, Polityka prywatności i Polityka cookies mają widoczną informację o wersji przedwdrożeniowej, `noindex` i nie trafiają do sitemap, a `build:production` kończy się błędem.

**Daty publikacji** (1.08–31.10.2026, rozkład 17/16/17, 50 różnych dni) są demonstracyjne i zapisane na stałe w plikach artykułów. Przed uruchomieniem publicznym zastąp je rzeczywistymi datami i ustaw `daty_publikacji_zweryfikowane: true`.

## Wdrożenie

Zawartość katalogu `dist/` wgraj do katalogu głównego domeny (np. `public_html`). Strona błędu: `404.html` (Apache: `ErrorDocument 404 /404.html`, Nginx: `error_page 404 /404.html;`). Adresy kończą się ukośnikiem (`/slug/` → `slug/index.html`).

## Adresy

| Typ | Schemat |
|---|---|
| Artykuł | `/slug/` |
| Temat | `/temat/<temat>/`, kolejne strony `/temat/<temat>/strona/2/` |
| Wszystkie publikacje | `/publikacje/`, `/publikacje/strona/2/` |
| Archiwum miesięczne | `/publikacje/miesiac/2026-10/` |
| Informacje | `/redakcja/`, `/kontakt/`, `/zasady-wspolpracy/`, `/tresci-sponsorowane/`, `/polityka-prywatnosci/`, `/polityka-cookies/`, `/mapa-serwisu/` |

## Struktura

```
horyzont-praktyczny/
├── astro.config.mjs              – SITE_URL, trailing slash, wtyczka rel="sponsored"
├── deployment.config.json        – dane wydawcy do uzupełnienia
├── selected-clients.json         – wynik losowania 10 klientów + profile, plan artykułów i anchory
├── public/img/                   – ilustracje SVG (1200×800), grafiki udostępniania JPG (1200×630), logo
├── scripts/
│   ├── client-base.txt           – baza 72 adresów
│   ├── draw-clients.mjs          – ważone losowanie (Efraimidis–Spirakis, crypto.randomInt)
│   ├── motifs.mjs, generate-images.mjs – ilustracje
│   ├── validate-content.mjs      – kontrola końcowa (treści + dist/ + niezależność od Mapy Codzienności)
│   ├── check-deploy-config.mjs   – blokada wersji produkcyjnej bez danych wydawcy
│   └── browser-check.mjs         – test w przeglądarce
└── src/
    ├── config/site.ts            – nazwa, hasło, tematy, linki informacyjne
    ├── content.config.ts         – schemat artykułów (m.in. keyPoints – sekcja „W skrócie”)
    ├── content/articles/*.md     – 50 artykułów
    ├── components/, layouts/     – nagłówek z szufladą mobilną, karty, sidebar, paginacja, okruszki
    ├── pages/                    – strona główna, artykuły, tematy, publikacje, sitemap, robots, RSS
    └── styles/site.css           – projekt graficzny
```

## Nowy artykuł

1. Plik `src/content/articles/nowy-slug.md` (małe litery ASCII, myślniki).
2. Front matter:

```yaml
---
title: "Tytuł"
seoTitle: "Tytuł do wyszukiwarki (do 70 znaków)"
seoDescription: "Opis (70–165 znaków)."
lead: "Wprowadzenie."
topic: "technologie-i-innowacje"
kind: "Poradnik"
published: 2026-11-10T09:00:00+01:00
coverAlt: "Opis ilustracji"
keyPoints: ["Punkt 1", "Punkt 2", "Punkt 3"]
related: ["slug-a", "slug-b", "slug-c"]
guide: false          # true = trafia do bloku „Polecane poradniki”
sources:
  - name: "Źródło"
    url: "https://…"
---
```

3. Motyw ilustracji w `scripts/motifs.mjs` (klucz = slug) lub własny obraz w polu `cover`.
4. `npm run build && npm run validate` (przy rozbudowie zaktualizuj oczekiwane liczby w walidatorze).

## Treści sponsorowane

Dziesięć artykułów ma `sponsored: true` i `partner: "<id>"`, etykietę „Artykuł sponsorowany”, ramkę informacyjną i dokładnie jeden link do partnera z `rel="sponsored noopener"` (nadawanym automatycznie przez `src/lib/mark-external-links.mjs`). Linki partnerów nie występują w menu, stopce ani sidebarze.
