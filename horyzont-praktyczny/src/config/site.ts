export const SITE = {
  name: 'Horyzont Praktyczny',
  tagline: 'Pomysły, rozwiązania, perspektywy',
  description:
    'Horyzont Praktyczny to ogólnopolski portal poradnikowo-informacyjny: analizy, porównania i rzeczowe wyjaśnienia o technologiach, gospodarce, nieruchomościach, zdrowiu, transporcie i codziennych decyzjach.',
  publisher: 'Zespół redakcyjny Horyzontu Praktycznego',
  locale: 'pl_PL',
  pageSize: 9,
  topicPageSize: 6,
};

export const TOPICS = [
  { slug: 'technologie-i-innowacje', name: 'Technologie i innowacje', short: 'Technologie', color: '#176B91', lede: 'Cyfryzacja, przemysł, energia i bezpieczeństwo danych – technologie opisane od strony praktycznych zastosowań.' },
  { slug: 'biznes-i-przedsiebiorczosc', name: 'Biznes i przedsiębiorczość', short: 'Biznes', color: '#0F766E', lede: 'Prowadzenie firmy w liczbach: koszty, płynność, obowiązki, sprzedaż i modele działalności.' },
  { slug: 'dom-i-nieruchomosci', name: 'Dom i nieruchomości', short: 'Nieruchomości', color: '#B45309', lede: 'Budowa, modernizacja, efektywność energetyczna, najem i zarządzanie nieruchomością.' },
  { slug: 'zdrowie-i-medycyna', name: 'Zdrowie i medycyna', short: 'Zdrowie', color: '#BE3F5A', lede: 'Diagnostyka, leczenie i profilaktyka w ujęciu opartym na zaleceniach instytucji medycznych.' },
  { slug: 'transport-i-motoryzacja', name: 'Transport i motoryzacja', short: 'Transport', color: '#475569', lede: 'Samochody, mobilność, przepisy i koszty – od zakupu auta po codzienne dojazdy.' },
  { slug: 'turystyka-i-wypoczynek', name: 'Turystyka i wypoczynek', short: 'Turystyka', color: '#2F855A', lede: 'Planowanie wyjazdów, prawa podróżnych, ubezpieczenia i formy wypoczynku.' },
  { slug: 'finanse-i-prawo', name: 'Finanse i prawo', short: 'Finanse i prawo', color: '#5B4BB7', lede: 'Oszczędzanie, inwestowanie na emeryturę, prawa konsumenta, dziedziczenie i transakcje.' },
  { slug: 'styl-zycia-i-rozwoj', name: 'Styl życia i rozwój', short: 'Styl życia', color: '#C2410C', lede: 'Nawyki, nauka, organizacja i hobby – rozwiązania, które porządkują codzienność.' },
] as const;

export type TopicSlug = (typeof TOPICS)[number]['slug'];
export const TOPIC_SLUGS = TOPICS.map((t) => t.slug) as [TopicSlug, ...TopicSlug[]];
export const topic = (slug: string) => TOPICS.find((t) => t.slug === slug)!;

export const INFO_LINKS = [
  { href: '/redakcja/', label: 'O portalu i redakcji' },
  { href: '/kontakt/', label: 'Kontakt' },
  { href: '/zasady-wspolpracy/', label: 'Zasady publikacji i współpracy' },
  { href: '/tresci-sponsorowane/', label: 'Treści sponsorowane' },
  { href: '/polityka-prywatnosci/', label: 'Polityka prywatności' },
  { href: '/polityka-cookies/', label: 'Polityka cookies' },
];
