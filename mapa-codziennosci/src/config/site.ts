/** Tożsamość portalu – wspólna dla wszystkich podstron. */
export const SITE = {
  name: 'Mapa Codzienności',
  tagline: 'Wiedza, która przydaje się na co dzień',
  description:
    'Mapa Codzienności to ogólnopolski magazyn internetowy z praktycznymi poradnikami o domu, zdrowiu, rodzinie, finansach, podróżach, pracy, technologiach i aktywności.',
  locale: 'pl_PL',
  lang: 'pl',
  publisherName: 'Redakcja Mapy Codzienności',
  perPage: 12,
  perCategoryPage: 6,
};

export const CATEGORIES = [
  {
    slug: 'dom-i-ogrod',
    name: 'Dom i ogród',
    short: 'Dom',
    color: '#718D79',
    description:
      'Remonty, urządzanie wnętrz, ogród przez cały rok i domowe sposoby na porządek oraz niższe rachunki.',
  },
  {
    slug: 'zdrowie',
    name: 'Zdrowie i profilaktyka',
    short: 'Zdrowie',
    color: '#4F7A8C',
    description:
      'Profilaktyka, badania, zdrowe nawyki i przygotowanie do wizyt u specjalistów – rzeczowo i bez straszenia.',
  },
  {
    slug: 'rodzina-i-styl-zycia',
    name: 'Rodzina i styl życia',
    short: 'Rodzina',
    color: '#B5835A',
    description:
      'Codzienność z dziećmi, opieka nad bliskimi, zwierzęta w domu i sposoby na spokojniejsze życie rodzinne.',
  },
  {
    slug: 'biznes-i-finanse',
    name: 'Biznes i finanse',
    short: 'Finanse',
    color: '#20384D',
    description:
      'Domowy budżet, kredyty, ubezpieczenia, oszczędzanie oraz pierwsze kroki we własnej firmie.',
  },
  {
    slug: 'podroze-i-regiony',
    name: 'Podróże i regiony',
    short: 'Podróże',
    color: '#5E8C8A',
    description:
      'Pomysły na wyjazdy po Polsce i Europie, prawa podróżnych oraz praktyczne listy przed drogą.',
  },
  {
    slug: 'praca-i-rozwoj',
    name: 'Praca i rozwój',
    short: 'Praca',
    color: '#8A6F9E',
    description:
      'Rekrutacja, organizacja pracy, zmiana zawodu i dbanie o siebie w życiu zawodowym.',
  },
  {
    slug: 'technologie-i-przemysl',
    name: 'Technologie i przemysł',
    short: 'Technologie',
    color: '#3E6E8E',
    description:
      'Bezpieczeństwo cyfrowe, energia, nowoczesna produkcja i technologie, które zmieniają inwestycje.',
  },
  {
    slug: 'motoryzacja-i-aktywnosc',
    name: 'Motoryzacja i aktywność',
    short: 'Aktywność',
    color: '#C08A3E',
    description:
      'Samochód w praktyce, bezpieczeństwo na drodze oraz sport i ruch dla dzieci i dorosłych.',
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];
export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug)!;

export const INFO_PAGES = [
  { href: '/o-portalu/', label: 'O portalu' },
  { href: '/kontakt/', label: 'Kontakt' },
  { href: '/zasady-publikacji-i-wspolpracy/', label: 'Zasady publikacji i współpracy' },
  { href: '/materialy-promocyjne/', label: 'Materiały promocyjne' },
  { href: '/polityka-prywatnosci/', label: 'Polityka prywatności' },
  { href: '/polityka-cookies/', label: 'Polityka cookies' },
];
