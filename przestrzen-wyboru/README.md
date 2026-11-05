# Przestrzeń Wyboru

**„Świadome decyzje. Lepsza codzienność”** – internetowy magazyn lifestyle'owo-poradnikowy o zdrowiu, psychologii, domu i wnętrzach, urodzie, podróżach, rodzinie, rozwoju osobistym i świadomych decyzjach konsumenckich. Grupa docelowa: osoby w wieku 25–55 lat. Projekt Astro (SSG), w pełni niezależny od portali Mapa Codzienności, Horyzont Praktyczny i Puls Regionów: własna konfiguracja (`src/config/magazine.ts`), schemat treści, komponenty, arkusz stylów (`src/styles/magazyn.css`), logo tekstowe, wizualizacje, losowanie klientów i ustawienia domeny.

## Uruchomienie

Wymagania: Node.js 18.20.8+.

```bash
npm install
npm run dev                                           # http://localhost:4321
SITE_URL=https://przestrzenwyboru.pl npm run build    # kompilacja do dist/
npm run validate                                      # kontrola końcowa -> RAPORT-WALIDACJI.md
npm run test:browser                                  # Chromium 390 px i 1280 px (Playwright)
```

`npm run build` najpierw generuje wizualizacje (`scripts/render-visuals.mjs`), potem buduje stronę. `przestrzenwyboru.pl` to domena robocza użyta w testach – docelowy adres podaje się w `SITE_URL`. Bez tej zmiennej powstaje kompilacja testowa z `robots.txt` blokującym indeksowanie.

Wersja produkcyjna:

```bash
SITE_URL=https://twoja-domena.pl npm run build:production
```

Polecenie sprawdza `deployment.config.json`, buduje stronę i uruchamia walidację.

## Dane do uzupełnienia przed publikacją (`deployment.config.json`)

| Pole | Zastosowanie |
|---|---|
| `wydawca.nazwa`, `wydawca.adres`, `wydawca.nip`, `wydawca.regon_krs` | Kontakt, Polityka prywatności |
| `kontakt.email_redakcji`, `kontakt.email_partnerstwa`, `kontakt.telefon` | Kontakt |
| `redakcja.redaktor_prowadzacy` | opcjonalnie – O magazynie |
| `analityka.wlaczona`, `analityka.narzedzie` | Polityka prywatności, Pliki cookies |
| `newsletter.*` | rezerwa na przyszłość (serwis nie zbiera danych) |
| `daty_demonstracyjne_zastapione` | potwierdzenie rzeczywistych dat publikacji |

Dopóki dane wydawcy są puste, strony Kontakt, Polityka prywatności i Pliki cookies pokazują informację o wersji przedpremierowej, mają `noindex` i nie trafiają do sitemap, a `build:production` kończy się błędem. Portal nie zawiera wymyślonych danych wydawcy, redaktorów ani adresów – teksty podpisuje „Zespół redakcyjny”.

**Daty publikacji** (1.08–31.10.2026, rozkład 16/18/16, 50 różnych dni, strefa Europe/Warsaw z uwzględnieniem zmiany czasu) są demonstracyjne i zapisane na stałe w plikach tekstów. Do czasu ustawienia `daty_demonstracyjne_zastapione: true` stopka i strona „O magazynie” informują, że to wersja przedpremierowa.

## Adresy

| Typ | Schemat |
|---|---|
| Tekst | `/slug/` (jednopoziomowo) |
| Rubryka | `/rubryka/<rubryka>/`, kolejne strony `/rubryka/<rubryka>/strona-2/`; przegląd `/rubryka/` |
| Wszystkie teksty | `/wszystkie-teksty/`, `/wszystkie-teksty/strona-2/` … `strona-5/` |
| Archiwum miesięczne | `/wszystkie-teksty/2026-09/` |
| Informacje | `/o-magazynie/`, `/zasady-publikacji/`, `/materialy-partnerskie/`, `/kontakt/`, `/prywatnosc/`, `/pliki-cookies/`, `/spis-tresci/` |
| Techniczne | `/sitemap.xml`, `/robots.txt`, `/rss.xml`, `/404.html` |

Wdrożenie: zawartość `dist/` do katalogu głównego domeny; strona błędu `404.html` (Apache: `ErrorDocument 404 /404.html`, Nginx: `error_page 404 /404.html;`).

## Rubryki

| Rubryka | Teksty | W tym partnerskie |
|---|---:|---:|
| Zdrowie i dobre samopoczucie | 9 | 1 |
| Psychologia i relacje | 7 | 0 |
| Dom i wnętrza | 8 | 3 |
| Uroda i pielęgnacja | 5 | 0 |
| Podróże i odpoczynek | 6 | 2 |
| Rodzina i wychowanie | 5 | 0 |
| Rozwój osobisty i kariera | 5 | 1 |
| Świadome zakupy i usługi | 5 | 3 |

## Projekt graficzny

- kolory: tło `#FAF8F5`, nagłówki `#30352F`, terakota `#A66B5B`, szałwia `#879B82`, tła dodatkowe `#EEE8E1`, tekst `#454545`,
- typografia: Playfair Display (nagłówki, logo) i Manrope (treść), samodzielnie hostowane – bez zewnętrznych serwerów czcionek,
- minimalistyczny nagłówek z wycentrowanym logo, nawigacja rubryk z animowanym podkreśleniem (na telefonie przewijana poziomo),
- okładka z pełnoszerokim zdjęciem i nachodzącą kartą tytułu, asymetryczne układy kart (pionowe, panoramiczne, kwadratowe, wierszowe), „Temat tygodnia – wybór redakcji”, „Warto przeczytać”, szerokie bloki na tle lnianym z płynnymi przejściami, sekcje przewijane poziomo na telefonie,
- artykuł: wąska kolumna treści (~690 px), wyróżniony lead, spis treści „W tym tekście” (sticky na komputerze), ramka „Artykuł sponsorowany”, źródła i „Czytaj dalej”,
- zero JavaScriptu wysyłanego do przeglądarki; animacje wyłącznie w CSS i wyłączane przy `prefers-reduced-motion`.

## Wizualizacje

Serwis nie korzysta ze zdjęć stockowych (brak możliwości weryfikacji licencji z tego środowiska). `scripts/render-visuals.mjs` generuje dla każdego tekstu unikatową kompozycję w stylu fotografii wnętrz i martwej natury (gradienty, światło z okna, cienie, ziarno) – sceny opisuje `scripts/scenes.mjs`, obiekty `scripts/visual-kit.mjs`. Wyniki: WebP 640/960/1600 px (16:10, `srcset`) i JPG 1200×630 do Open Graph. Własne zdjęcia można podmienić, zachowując nazwy plików w `public/obrazy/`.

## Materiały partnerskie

Dziesięć tekstów ma `sponsored: true` i `partner: "<id>"`: etykietę „Partner” na listach, „Materiał partnerski” przy rubryce, ramkę „Artykuł sponsorowany” przed treścią i dokładnie jeden link do klienta w środkowym, tematycznym akapicie, z `rel="sponsored noopener"` (dodawanym przez `src/lib/rel-attrs.mjs`). Linki klientów nie występują w nagłówku, stopce ani blokach polecanych. Losowanie: `scripts/draw-clients.mjs` (Fisher–Yates, `crypto.randomInt`, jednakowe szanse dla 70 firm z bazy 72 adresów); wynik, profile, obszar działania, plan tekstów i anchory – `selected-clients.json`. Ponowne losowanie wymaga `--force`.

## Struktura

```
przestrzen-wyboru/
├── astro.config.mjs              – SITE_URL, trailing slash, wtyczka rel="sponsored"
├── deployment.config.json        – dane wydawcy do uzupełnienia
├── selected-clients.json         – wynik losowania + profile, plan tekstów i anchory
├── public/obrazy/                – wizualizacje WebP, grafiki udostępniania JPG, logo
├── scripts/
│   ├── client-base.txt           – baza 72 adresów
│   ├── draw-clients.mjs          – czwarte, niezależne losowanie
│   ├── visual-kit.mjs, scenes.mjs, render-visuals.mjs – wizualizacje
│   ├── validate-content.mjs      – kontrola końcowa (treści, dist/, niezależność od 3 portali)
│   ├── check-deploy-config.mjs   – blokada wersji produkcyjnej bez danych wydawcy
│   └── browser-check.mjs         – test w przeglądarce
└── src/
    ├── config/magazine.ts        – nazwa, hasło, rubryki, strony informacyjne
    ├── content.config.ts         – schemat tekstów
    ├── content/teksty/*.md       – 50 tekstów
    ├── components/, layouts/     – nagłówek, stopka, karty, okładka, archiwa, okruszki, paginacja
    ├── pages/                    – strona główna, teksty, rubryki, archiwa, sitemap, robots, RSS
    └── styles/magazyn.css        – projekt graficzny
```

## Nowy tekst

1. Plik `src/content/teksty/nowy-slug.md` (małe litery ASCII, myślniki).
2. Front matter:

```yaml
---
title: "Tytuł"
seo:
  title: "Tytuł do wyszukiwarki (do 66 znaków)"
  description: "Opis (90–158 znaków)."
standfirst: "Lead – co najmniej 120 znaków."
rubric: "dom-i-wnetrza"
format: "Poradnik"            # Poradnik | Przewodnik | Porównanie | Lista kontrolna | Esej poradnikowy | Wyjaśniamy
published: 2026-11-10T09:00:00+01:00
visualAlt: "Opis zdjęcia wyróżniającego"
related: ["slug-a", "slug-b", "slug-c"]
worthReading: false           # sekcja „Warto przeczytać”
sources:
  - name: "Źródło"
    url: "https://…"
---
```

3. Scena wizualizacji w `scripts/scenes.mjs` (klucz = slug) – albo własne pliki `public/obrazy/<slug>-640.webp`, `-960.webp`, `-1600.webp` i `udostepnij/<slug>.jpg`.
4. `npm run build && npm run validate` (przy rozbudowie zaktualizuj oczekiwane liczby w walidatorze).
