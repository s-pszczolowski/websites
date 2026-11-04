# Mapa Codzienności

**„Wiedza, która przydaje się na co dzień”** – ogólnopolski magazyn internetowy z praktycznymi poradnikami, tekstami wyjaśniającymi i listami kontrolnymi. Projekt Astro (generowanie statyczne, SSG): 50 artykułów w 8 działach, każdy na własnej, jednopoziomowej podstronie (`/slug/`), dostępnej bez JavaScriptu.

## Szybki start

Wymagania: Node.js 18.20.8+ (testowano na 22).

```bash
npm install
npm run dev                                   # podgląd lokalny: http://localhost:4321
SITE_URL=https://mapacodziennosci.pl npm run build   # kompilacja do dist/
npm run validate                              # kontrola końcowa -> RAPORT-WALIDACJI.md
npm run test:browser                          # test w Chromium (390 px i 1280 px), wymaga Playwright
```

`npm run build` najpierw generuje ilustracje (`scripts/generate-images.mjs`), potem buduje stronę.

## Domena (SITE_URL)

Adres serwisu ustawia się **wyłącznie** zmienną środowiskową `SITE_URL` (bez ukośnika na końcu). Od niej zależą canonical, Open Graph, dane strukturalne, `sitemap.xml`, `robots.txt` i RSS.

- Bez `SITE_URL` powstaje kompilacja testowa dla `http://localhost:4321`, a `robots.txt` blokuje indeksowanie (`Disallow: /`).
- Wersja produkcyjna: `SITE_URL=https://twojadomena.pl npm run build:production` – polecenie sprawdza konfigurację wdrożeniową (patrz niżej), buduje stronę i uruchamia walidację.

## Przed publicznym uruchomieniem – dane do uzupełnienia

Plik `deployment.config.json` zawiera pola, których **nie wolno wymyślać** – uzupełnia je rzeczywisty właściciel:

| Pole | Gdzie jest używane |
|---|---|
| `administrator.nazwa`, `administrator.adres`, `administrator.nip`, `administrator.regon_lub_krs` | Kontakt, Polityka prywatności (administrator danych) |
| `kontakt.email_redakcji`, `kontakt.email_wspolpraca`, `kontakt.telefon` | Kontakt, Polityka prywatności |
| `redaktor_naczelny` | do wykorzystania na stronie O portalu (opcjonalnie) |
| `analityka.uzywana`, `analityka.narzedzie` | Polityka cookies (jeśli zostanie dodana analityka) |
| `daty_publikacji_potwierdzone` | potwierdzenie, że daty w artykułach są rzeczywistymi datami publikacji |

Dopóki dane administratora są puste, strony **Kontakt**, **Polityka prywatności** i **Polityka cookies** mają widoczną informację o wersji przedwdrożeniowej, znacznik `noindex` i nie trafiają do sitemap, a `npm run build:production` kończy się błędem.

**Daty publikacji** (1.08–31.10.2026) zostały przypisane demonstracyjnie (losowo, 16/17/17, 50 różnych dni) i zapisane na stałe w plikach artykułów. Przed uruchomieniem publicznym zastąp je faktycznymi datami publikacji i ustaw `daty_publikacji_potwierdzone: true`.

## Wdrożenie na hosting

Po `npm run build` cała strona znajduje się w katalogu **`dist/`**. Wgraj jego **zawartość** do katalogu głównego domeny (np. `public_html` przez FTP/SFTP). Nie jest potrzebny PHP ani baza danych.

- Adresy kończą się ukośnikiem (`/slug/` → `slug/index.html`) – działa domyślnie na Apache, Nginx, Netlify, Cloudflare Pages, GitHub Pages.
- Strona błędu: `404.html` (Apache: `ErrorDocument 404 /404.html`, Nginx: `error_page 404 /404.html;`).
- Zalecane przekierowanie 301 z wersji `www`/bez `www` i z `http` na jeden kanoniczny adres `https://` (ustawienie serwera lub panelu hostingu).

## Struktura projektu

```
mapa-codziennosci/
├── astro.config.mjs            – konfiguracja (SITE_URL, trailing slash, wtyczka rel="sponsored")
├── deployment.config.json      – dane właściciela do uzupełnienia przed publikacją
├── selected-clients.json       – zapisany wynik losowania 10 klientów + profile i plan artykułów
├── public/
│   ├── favicon.svg
│   └── images/                 – ilustracje SVG artykułów, grafiki OG (JPG 1200×630), logo
├── scripts/
│   ├── client-base.txt         – zamknięta baza 72 adresów klientów
│   ├── draw-clients.mjs        – jednorazowe losowanie (Fisher–Yates + crypto.randomInt)
│   ├── motifs.mjs              – motywy ilustracji (po jednym na artykuł)
│   ├── generate-images.mjs     – generator ilustracji SVG, JPG OG, logo
│   ├── validate-content.mjs    – automatyczna kontrola końcowa (źródła + dist/)
│   ├── check-deploy-config.mjs – blokada kompilacji produkcyjnej bez danych właściciela
│   └── browser-check.mjs       – test w Chromium: responsywność, obrazy, menu, paginacja
└── src/
    ├── config/site.ts          – nazwa, hasło, działy, podstrony informacyjne
    ├── content.config.ts       – schemat kolekcji artykułów
    ├── content/articles/*.md   – 50 artykułów (front matter + Markdown); nazwa pliku = adres URL
    ├── components/             – nagłówek, stopka, karty, okruszki, paginacja, JSON-LD
    ├── layouts/                – układ bazowy (SEO) i układ stron informacyjnych
    ├── lib/                    – pomocnicze funkcje artykułów, wtyczka linków zewnętrznych
    ├── pages/                  – strona główna, artykuły, działy, archiwa, sitemap, robots, RSS
    └── styles/global.css       – projekt graficzny
```

## Jak dodać nowy artykuł

1. Utwórz plik `src/content/articles/nowy-slug.md` (małe litery, bez polskich znaków, wyrazy oddzielone myślnikami – nazwa pliku staje się adresem `/nowy-slug/`).
2. Uzupełnij front matter:

```yaml
---
title: "Tytuł artykułu"
metaTitle: "Tytuł do wyników wyszukiwania (do 70 znaków)"
metaDescription: "Opis do wyników wyszukiwania (70–170 znaków)."
lead: "Wprowadzenie wyświetlane pod tytułem i na kartach."
category: "dom-i-ogrod"        # slug działu z src/config/site.ts
format: "Poradnik"
date: 2026-11-10T09:00:00+01:00
imageAlt: "Opis ilustracji"
related: ["slug-1", "slug-2", "slug-3"]
sources:
  - title: "Nazwa źródła"
    url: "https://…"
---
Treść w Markdown, z nagłówkami ## i ###.
```

3. Dodaj motyw ilustracji w `scripts/motifs.mjs` (klucz = slug) albo ustaw własny obraz w polu `image: "/images/…"` (plik w `public/images/`).
4. `npm run build && npm run validate`.

Walidator jest skonfigurowany pod obecny zestaw (dokładnie 50 artykułów, 10 linków partnerskich). Przy rozbudowie serwisu zaktualizuj oczekiwane wartości w `scripts/validate-content.mjs`.

## Materiały partnerskie

Dziesięć artykułów zawiera po jednym kontekstowym linku do strony wylosowanego klienta. Takie artykuły mają w danych `sponsored: true` i `client: "<id>"`, etykietę „Materiał partnerski” przy tytule i na kartach oraz ramkę informacyjną w treści. Wtyczka `src/lib/rehype-external-links.mjs` automatycznie nadaje linkom do domen z bazy klientów atrybut `rel="sponsored noopener"`. Linki do klientów nie występują w menu, stopce ani elementach wspólnych. Szczegóły: `RAPORT-WALIDACJI.md` i `selected-clients.json`.

Losowanie odbyło się raz (`npm run draw-clients`); ponowne uruchomienie skryptu nie zmienia wyniku, dopóki istnieje `selected-clients.json`.
