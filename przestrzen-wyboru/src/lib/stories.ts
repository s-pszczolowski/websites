import { getCollection, type CollectionEntry } from 'astro:content';
import { MAGAZINE, RUBRICS, rubric } from '../config/magazine';

export type Story = CollectionEntry<'teksty'>;

let cache: Story[] | null = null;
/** Wszystkie teksty od najnowszego do najstarszego. */
export async function allStories(): Promise<Story[]> {
  if (!cache) cache = (await getCollection('teksty')).sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
  return cache;
}

export const storyUrl = (s: Story) => `/${s.id}/`;
export const rubricUrl = (slug: string, page = 1) => (page <= 1 ? `/rubryka/${slug}/` : `/rubryka/${slug}/strona-${page}/`);
export const archiveUrl = (page = 1) => (page <= 1 ? '/wszystkie-teksty/' : `/wszystkie-teksty/strona-${page}/`);
export const monthUrl = (ym: string) => `/wszystkie-teksty/${ym}/`;
export const visual = (slug: string, w: 640 | 960 | 1600 = 960) => `/obrazy/${slug}-${w}.webp`;
export const visualSet = (slug: string) => `${visual(slug, 640)} 640w, ${visual(slug, 960)} 960w, ${visual(slug, 1600)} 1600w`;
export const shareImage = (slug: string) => `/obrazy/udostepnij/${slug}.jpg`;

const tz = 'Europe/Warsaw';
export const longDate = (d: Date) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: tz }).format(d);
export const shortDate = (d: Date) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', timeZone: tz }).format(d);
export const isoDate = (d: Date) => d.toISOString();
export const ymOf = (d: Date) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: tz }).format(d).slice(0, 7);
const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
export const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;

export function monthsOf(stories: Story[]) {
  const map = new Map<string, number>();
  for (const s of stories) map.set(ymOf(s.data.published), (map.get(ymOf(s.data.published)) || 0) + 1);
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([ym, count]) => ({ ym, count }));
}

export const minutes = (body = '') => Math.max(3, Math.round(body.split(/\s+/).filter(Boolean).length / 170));

export function rubricsWithCounts(stories: Story[]) {
  return RUBRICS.map((r) => ({ ...r, count: stories.filter((s) => s.data.rubric === r.slug).length }));
}

export async function relatedTo(s: Story) {
  const all = await allStories();
  return s.data.related.map((id) => all.find((x) => x.id === id)).filter(Boolean) as Story[];
}

export const rubricOf = (s: Story) => rubric(s.data.rubric);
export const pageCount = (n: number, per: number = MAGAZINE.perPage) => Math.max(1, Math.ceil(n / per));
export const pageSlice = <T,>(items: T[], page: number, per: number = MAGAZINE.perPage) => items.slice((page - 1) * per, page * per);
