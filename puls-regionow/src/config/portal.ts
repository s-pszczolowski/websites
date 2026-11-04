export const PORTAL = {
  name: 'Puls Regionów',
  motto: 'Ludzie, miejsca, sprawy codzienne',
  about: 'Puls Regionów to regionalny portal informacyjno-poradnikowy o życiu mieszkańców polskich miast i regionów – ze szczególnym uwzględnieniem Szczecina, Pomorza Zachodniego i wybrzeża Bałtyku.',
  newsroom: 'Redakcja Pulsu Regionów',
  perList: 10,
  perSection: 6,
};

export const SECTIONS = [
  { slug: 'szczecin-i-pomorze-zachodnie', label: 'Szczecin i Pomorze Zachodnie', nav: 'Szczecin i region', tint: '#B33434', intro: 'Sprawy mieszkańców Szczecina i Pomorza Zachodniego: miasto, przyroda, środowisko i życie przy granicy.' },
  { slug: 'dom-remonty-i-nieruchomosci', label: 'Dom, remonty i nieruchomości', nav: 'Dom', tint: '#8A5A2B', intro: 'Budowa, remont, zakup i utrzymanie nieruchomości – z uwzględnieniem warunków nad morzem i na wsi.' },
  { slug: 'zdrowie-i-specjalisci', label: 'Zdrowie i specjaliści', nav: 'Zdrowie', tint: '#1F6F78', intro: 'Gdzie szukać pomocy medycznej, jak korzystać z systemu ochrony zdrowia i dbać o profilaktykę.' },
  { slug: 'lokalny-biznes-i-gospodarka', label: 'Lokalny biznes i gospodarka', nav: 'Biznes', tint: '#2E4B7A', intro: 'Gospodarka regionu, mała przedsiębiorczość, praca i formalności dla firm – także po obu stronach granicy.' },
  { slug: 'turystyka-i-wypoczynek', label: 'Turystyka i wypoczynek', nav: 'Turystyka', tint: '#3C7A3B', intro: 'Wybrzeże, jeziora, uzdrowiska i miejsca na weekend – w regionie i w innych częściach Polski.' },
  { slug: 'transport-i-motoryzacja', label: 'Transport i motoryzacja', nav: 'Transport', tint: '#4B5563', intro: 'Komunikacja miejska, promy, parkowanie, przepisy i bezpieczeństwo na drogach.' },
  { slug: 'rodzina-i-codzienne-zycie', label: 'Rodzina i codzienne życie', nav: 'Rodzina', tint: '#A0522D', intro: 'Sprawy rodzinne, czas wolny dzieci, ulgi dla rodzin i codzienne decyzje domowe.' },
  { slug: 'technologie-i-uslugi', label: 'Technologie i usługi', nav: 'Technologie', tint: '#5B3F8C', intro: 'Usługi cyfrowe, internet, naprawy i technologie, z których korzystamy na co dzień.' },
] as const;
export type SectionSlug = (typeof SECTIONS)[number]['slug'];
export const SECTION_SLUGS = SECTIONS.map((s) => s.slug) as [SectionSlug, ...SectionSlug[]];
export const sectionOf = (slug: string) => SECTIONS.find((s) => s.slug === slug)!;

export const REGIONS = [
  { slug: 'szczecin', label: 'Szczecin', intro: 'Publikacje dotyczące Szczecina i jego najbliższych okolic.' },
  { slug: 'pomorze-zachodnie', label: 'Pomorze Zachodnie', intro: 'Sprawy całego województwa zachodniopomorskiego – od pojezierzy po pogranicze.' },
  { slug: 'wybrzeze', label: 'Wybrzeże Bałtyku', intro: 'Morze, kurorty, wyspy i życie nad Bałtykiem.' },
  { slug: 'polska', label: 'Polska i inne regiony', intro: 'Poradniki ogólnopolskie i teksty o innych miastach i regionach kraju.' },
] as const;
export type RegionSlug = (typeof REGIONS)[number]['slug'];
export const REGION_SLUGS = REGIONS.map((r) => r.slug) as [RegionSlug, ...RegionSlug[]];
export const regionOf = (slug: string) => REGIONS.find((r) => r.slug === slug)!;

export const PAGES = [
  { href: '/o-nas/', label: 'O portalu' },
  { href: '/kontakt/', label: 'Kontakt z redakcją' },
  { href: '/wspolpraca/', label: 'Zasady publikacji i współpracy' },
  { href: '/artykuly-sponsorowane/', label: 'Artykuły sponsorowane' },
  { href: '/polityka-prywatnosci/', label: 'Polityka prywatności' },
  { href: '/cookies/', label: 'Polityka cookies' },
];
