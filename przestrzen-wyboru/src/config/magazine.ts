// Konfiguracja magazynu Przestrzeń Wyboru – nazwa, rubryki, strony informacyjne.
export const MAGAZINE = {
  name: 'Przestrzeń Wyboru',
  tagline: 'Świadome decyzje. Lepsza codzienność',
  description: 'Magazyn o świadomym stylu życia: zdrowie, psychologia, dom i wnętrza, uroda, podróże, rodzina, rozwój i rozsądne decyzje konsumenckie.',
  team: 'Zespół redakcyjny Przestrzeni Wyboru',
  perPage: 6, // teksty na stronie rubryki
  archivePerPage: 10, // teksty na stronie „Wszystkie teksty”
  locale: 'pl_PL',
} as const;

export const RUBRICS = [
  { slug: 'zdrowie-i-dobre-samopoczucie', title: 'Zdrowie i dobre samopoczucie', short: 'Zdrowie', hue: '#8B5E50', lede: 'Ruch, odżywianie, odpoczynek i profilaktyka – w oparciu o rzetelne źródła, bez obietnic bez pokrycia.' },
  { slug: 'psychologia-i-relacje', title: 'Psychologia i relacje', short: 'Psychologia', hue: '#6F7F6A', lede: 'Emocje, bliskość, komunikacja i uważność w codziennych sytuacjach.' },
  { slug: 'dom-i-wnetrza', title: 'Dom i wnętrza', short: 'Dom', hue: '#A66B5B', lede: 'Światło, kolor, rośliny, porządek i komfort – mieszkanie, w którym dobrze się żyje.' },
  { slug: 'uroda-i-pielegnacja', title: 'Uroda i pielęgnacja', short: 'Uroda', hue: '#9A7068', lede: 'Pielęgnacja skóry, dłoni i włosów oparta na zrozumieniu składów, a nie na modzie.' },
  { slug: 'podroze-i-odpoczynek', title: 'Podróże i odpoczynek', short: 'Podróże', hue: '#5E7A80', lede: 'Wyjazdy blisko i daleko, wolne podróżowanie i odpoczynek, który naprawdę regeneruje.' },
  { slug: 'rodzina-i-wychowanie', title: 'Rodzina i wychowanie', short: 'Rodzina', hue: '#977A55', lede: 'Codzienność z dziećmi i nastolatkami: rozmowy, emocje, nawyki i rodzinne finanse.' },
  { slug: 'rozwoj-osobisty-i-kariera', title: 'Rozwój osobisty i kariera', short: 'Rozwój', hue: '#5F6B5A', lede: 'Nawyki, praca, rozmowy zawodowe i uczenie się przez całe życie.' },
  { slug: 'swiadome-zakupy-i-uslugi', title: 'Świadome zakupy i usługi', short: 'Zakupy i usługi', hue: '#7C6A5C', lede: 'Prawa konsumenta, odpowiedzialne wybory i korzystanie z profesjonalnych usług.' },
] as const;

export type RubricSlug = (typeof RUBRICS)[number]['slug'];
export const RUBRIC_SLUGS = RUBRICS.map((r) => r.slug) as [RubricSlug, ...RubricSlug[]];
export const rubric = (slug: string) => RUBRICS.find((r) => r.slug === slug)!;

export const INFO_PAGES = [
  { href: '/o-magazynie/', label: 'O magazynie' },
  { href: '/zasady-publikacji/', label: 'Zasady publikacji i współpracy' },
  { href: '/materialy-partnerskie/', label: 'Materiały partnerskie' },
  { href: '/kontakt/', label: 'Kontakt' },
  { href: '/prywatnosc/', label: 'Polityka prywatności' },
  { href: '/pliki-cookies/', label: 'Pliki cookies' },
  { href: '/spis-tresci/', label: 'Spis treści' },
] as const;
