#!/usr/bin/env python3
"""Generuje podstrony informacyjne (pages/*.md) dla każdego portalu.

Treści są dopasowane do profilu każdego serwisu. Skrypt nadpisuje pliki
w katalogach pages/ – uruchamiaj go tylko, gdy chcesz odtworzyć podstrony.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PORTALS = {
    "szczecinnacodzien.pl": {
        "name": "Szczecin na co dzień", "mail": "redakcja@szczecinnacodzien.pl",
        "about": "Szczecin na co dzień to regionalny portal poradnikowo-informacyjny dla mieszkańców Szczecina i Pomorza Zachodniego. Piszemy o tym, z czym mieszkańcy spotykają się na co dzień: o opiece zdrowotnej w mieście, usługach, sprawach urzędowych, życiu na osiedlu, a także o miejscach wartych odwiedzenia w regionie.",
        "focus": ["praktyczne poradniki dla mieszkańców miasta i regionu", "informacje o korzystaniu z opieki zdrowotnej i usług", "propozycje spacerów, wycieczek i spędzania wolnego czasu", "tematy sąsiedzkie i osiedlowe"],
        "voice": "Staramy się pisać konkretnie i lokalnie – tak, by artykuł był przydatny osobie, która mieszka w Szczecinie lub planuje tu przyjechać.",
        "extra": "## Informacje lokalne\n\nAdresy placówek, godziny otwarcia, rozkłady jazdy i zasady działania instytucji mogą się zmieniać. W artykułach odsyłamy do oficjalnych źródeł – przed wizytą warto sprawdzić aktualne informacje u źródła.",
    },
    "pulsprofilaktyki.pl": {
        "name": "Puls Profilaktyki", "mail": "redakcja@pulsprofilaktyki.pl",
        "about": "Puls Profilaktyki to portal o zdrowiu, który tłumaczy w przystępny sposób zagadnienia z zakresu profilaktyki, diagnostyki, zdrowia psychicznego i fizycznego. Chcemy pomagać czytelnikom lepiej rozumieć wyniki badań, zalecenia i sygnały wysyłane przez organizm.",
        "focus": ["profilaktyka i badania przesiewowe", "przygotowanie do badań i interpretacja podstawowych wyników", "zdrowie psychiczne, sen i stres", "ruch, żywienie i życie z chorobą przewlekłą"],
        "voice": "Każdy artykuł opieramy na publicznie dostępnych zaleceniach instytucji i towarzystw naukowych, które wskazujemy w sekcji „Bibliografia i źródła”.",
        "extra": "## Treści medyczne\n\nMateriały mają charakter edukacyjny i nie zastępują porady lekarza, diagnozy ani leczenia. Nie publikujemy wypowiedzi przypisywanych konkretnym specjalistom bez ich zgody ani historii pacjentów. Zalecenia medyczne zmieniają się wraz z postępem wiedzy – w razie wątpliwości zawsze rozstrzyga lekarz prowadzący. W nagłych przypadkach dzwoń pod numer 112.",
    },
    "nastrojmagazyn.pl": {
        "name": "Nastrój", "mail": "redakcja@nastrojmagazyn.pl",
        "about": "Nastrój to internetowy magazyn o codzienności. Piszemy o relacjach, dbaniu o zdrowie i urodę, rozwoju osobistym i domu – z uważnością, bez presji i bez obietnic cudownych przemian.",
        "focus": ["relacje: związki, przyjaźnie, granice", "codzienne rytuały i nawyki", "pielęgnacja i uroda bez mitów", "rozwój osobisty i dom"],
        "voice": "Lubimy teksty, które zostawiają czytelnika z czymś do przemyślenia i z jedną małą rzeczą do wypróbowania jutro.",
        "extra": "## Zdrowie i uroda\n\nTeksty o zdrowiu i pielęgnacji mają charakter ogólny. Nie zastępują porady lekarza, dermatologa czy psychologa – zwłaszcza gdy problem się utrzymuje lub nasila.",
    },
    "rodzinnykompas.pl": {
        "name": "Rodzinny Kompas", "mail": "kontakt@rodzinnykompas.pl",
        "about": "Rodzinny Kompas to portal dla rodziców, par i całych rodzin. Publikujemy poradniki o wychowaniu, emocjach dzieci i dorosłych, związku w czasie rodzicielstwa, zdrowiu rodziny, szkole i wspólnym spędzaniu czasu.",
        "focus": ["rodzicielstwo od przedszkola po okres nastoletni", "emocje dzieci i dorosłych", "związek i komunikacja w rodzinie", "zdrowie rodziny, szkoła i czas razem"],
        "voice": "Piszemy ciepło i praktycznie – bez oceniania rodziców i bez jednej „jedynie słusznej” metody wychowania.",
        "extra": "## Zdrowie dzieci\n\nArtykuły o zdrowiu dzieci i dorosłych mają charakter informacyjny i nie zastępują konsultacji z pediatrą, lekarzem rodzinnym czy psychologiem. Gdy coś Cię niepokoi – skontaktuj się ze specjalistą. W sytuacji zagrożenia życia dzwoń pod 112, a dzieci i młodzież mogą szukać wsparcia pod numerem 116 111.",
    },
    "wiemiwybieram.pl": {
        "name": "Wiem i Wybieram", "mail": "redakcja@wiemiwybieram.pl",
        "about": "Wiem i Wybieram to portal poradnikowo-informacyjny o świadomych wyborach na co dzień. Tłumaczymy krok po kroku, jak korzystać z opieki zdrowotnej, jak wybrać specjalistę, jak dochodzić praw konsumenta, jak planować domowe finanse i bezpiecznie urządzić dom.",
        "focus": ["zdrowie i korzystanie z opieki zdrowotnej", "wybór specjalistów", "prawa konsumenta i bezpieczne zakupy", "finanse domowe, dom i świadome wybory"],
        "voice": "Stawiamy na konkret: listy kontrolne, kroki do wykonania i wskazanie oficjalnych źródeł, w których można sprawdzić aktualne przepisy.",
        "extra": "## Przepisy i porady\n\nPoradniki mają charakter informacyjny i nie stanowią porady medycznej, prawnej ani finansowej w indywidualnej sprawie. Przepisy i zasady instytucji się zmieniają – zawsze wskazujemy źródła, w których warto zweryfikować aktualny stan prawny.",
    },
}


def page(title, desc, body):
    return f"---\ntitle: {title}\ndescription: {desc}\n---\n{body.strip()}\n"


def build(slug, p):
    out = ROOT / slug / "pages"
    out.mkdir(exist_ok=True)
    for f in out.glob("*.md"):
        f.unlink()
    n, mail = p["name"], p["mail"]
    focus = "\n".join(f"- {x}," for x in p["focus"][:-1]) + f"\n- {p['focus'][-1]}."
    (out / "o-nas.md").write_text(page(
        "O nas", f"Kim jesteśmy i o czym piszemy w serwisie {n}.",
        f"""{p['about']}

## O czym piszemy

{focus}

## Jak pracujemy

{p['voice']} Artykuły przygotowuje zespół redakcyjny serwisu. Nie podpisujemy tekstów fikcyjnymi nazwiskami ani nie przypisujemy wypowiedzi osobom, które ich nie udzieliły.

## Kontakt z redakcją

Uwagi do artykułów, propozycje tematów i zgłoszenia błędów przyjmujemy pod adresem {mail}. Szczegóły znajdziesz na stronie [Kontakt](/kontakt/), a zasady naszej pracy – w dokumencie [Zasady redakcyjne](/zasady-redakcyjne/)."""), encoding="utf-8")
    (out / "kontakt.md").write_text(page(
        "Kontakt", f"Dane kontaktowe redakcji serwisu {n}: zgłoszenia błędów, propozycje tematów, współpraca.",
        f"""Chętnie odpowiemy na pytania i uwagi dotyczące publikacji w serwisie {n}.

## Redakcja

- e-mail: {mail}
- zgłoszenia błędów i nieaktualnych informacji: w tytule wiadomości wpisz „Korekta” i adres artykułu,
- propozycje tematów: opisz krótko, czego dotyczy temat i dlaczego jest ważny dla czytelników.

## Współpraca

Zapytania dotyczące materiałów partnerskich kieruj na ten sam adres z dopiskiem „Współpraca”. Zasady oznaczania takich treści opisujemy na stronie [Współpraca i reklama](/wspolpraca-i-reklama/).

## Ważne

Redakcja nie udziela indywidualnych porad medycznych, prawnych ani finansowych. W sytuacji zagrożenia życia lub zdrowia dzwoń pod numer alarmowy 112."""), encoding="utf-8")
    (out / "zasady-redakcyjne.md").write_text(page(
        "Zasady redakcyjne", f"Jak powstają artykuły w serwisie {n}: źródła, korekty, oznaczanie treści sponsorowanych.",
        f"""Chcemy, by czytelnicy serwisu {n} wiedzieli, jak powstają nasze teksty i czego mogą się po nich spodziewać.

## Źródła i rzetelność

- Opieramy się na publicznie dostępnych informacjach instytucji, urzędów i towarzystw naukowych; przy artykułach podajemy źródła.
- Nie publikujemy wymyślonych statystyk, badań, cytatów ani historii osób.
- Gdy zasady lub przepisy mogą się zmieniać, zaznaczamy to w tekście i odsyłamy do oficjalnych serwisów.

## Daty publikacji

Każdy artykuł ma datę publikacji widoczną pod tytułem i zapisaną w metadanych strony. Archiwum publikacji jest dostępne na stronie [Archiwum](/archiwum/).

## Korekty

Jeśli zauważysz błąd, napisz do nas – sprawdzimy zgłoszenie i w razie potrzeby poprawimy tekst.

## Materiały sponsorowane

Artykuły przygotowane we współpracy z partnerami są wyraźnie oznaczone etykietą przy tytule oraz informacją na początku tekstu. Linki do stron partnerów w takich materiałach mają atrybut rel="sponsored". Materiał sponsorowany nie może zawierać nieprawdziwych informacji, fikcyjnych opinii klientów ani obietnic efektów leczenia.

{p['extra']}"""), encoding="utf-8")
    (out / "wspolpraca-i-reklama.md").write_text(page(
        "Współpraca i reklama", f"Zasady publikacji materiałów partnerskich i sponsorowanych w serwisie {n}.",
        f"""Serwis {n} publikuje przede wszystkim materiały redakcyjne. Część artykułów może powstawać we współpracy z partnerami.

## Jak oznaczamy materiały partnerskie

1. Przy tytule artykułu wyświetlamy etykietę informującą o charakterze sponsorowanym.
2. Na początku tekstu umieszczamy informację o współpracy z partnerem.
3. Linki do partnera oznaczamy atrybutem rel="sponsored".
4. Linki partnerskie umieszczamy wyłącznie w treści merytorycznie powiązanej z tematem – nie dodajemy ich masowo do menu, stopki ani kolumn bocznych.

## Czego nie publikujemy

- tekstów zawierających nieprawdziwe lub niesprawdzalne obietnice,
- fikcyjnych opinii, recenzji i rekomendacji,
- treści, które mogłyby wprowadzać w błąd co do zdrowia lub bezpieczeństwa czytelników.

## Kontakt

Zapytania o współpracę: {mail}."""), encoding="utf-8")
    (out / "polityka-prywatnosci.md").write_text(page(
        "Polityka prywatności", f"Informacje o przetwarzaniu danych i plikach cookies w serwisie {n}.",
        f"""Szanujemy prywatność czytelników serwisu {n}. Poniżej wyjaśniamy, jakie dane mogą być przetwarzane podczas korzystania ze strony.

## Strona bez kont i formularzy

Serwis jest stroną statyczną: nie wymaga zakładania konta, nie zawiera formularzy rejestracyjnych ani komentarzy. Nie zbieramy danych osobowych za pomocą strony.

## Logi serwera

Jak każdy serwer internetowy, serwer hostingowy może automatycznie zapisywać podstawowe informacje techniczne, np. adres IP, datę wizyty, typ przeglądarki i adres odwiedzanej podstrony. Dane te służą do zapewnienia bezpieczeństwa i prawidłowego działania serwisu.

## Pliki cookies

Strona w obecnej postaci nie korzysta z plików cookies do celów analitycznych ani reklamowych i nie ładuje zewnętrznych skryptów śledzących. Jeżeli w przyszłości zostaną dodane narzędzia analityczne, informacja o nich pojawi się w tym miejscu, a tam, gdzie wymagają tego przepisy, poprosimy o zgodę.

## Kontakt e-mailowy

Jeżeli napiszesz do nas na adres {mail}, przetwarzamy dane zawarte w wiadomości wyłącznie w celu udzielenia odpowiedzi.

## Linki zewnętrzne

Artykuły zawierają linki do innych serwisów – instytucji, źródeł i partnerów. Za zasady prywatności tych stron odpowiadają ich administratorzy.

## Twoje prawa

Masz prawo do dostępu do swoich danych, ich sprostowania, usunięcia lub ograniczenia przetwarzania oraz prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych."""), encoding="utf-8")


if __name__ == "__main__":
    for slug, p in PORTALS.items():
        build(slug, p)
        print("pages:", slug)
