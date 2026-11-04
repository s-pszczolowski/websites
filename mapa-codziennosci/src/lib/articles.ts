import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES } from '../config/site';

export type Article = CollectionEntry<'articles'>;

/** Wszystkie artykuły, od najnowszego do najstarszego. */
export async function getArticles(): Promise<Article[]> {
  const all = await getCollection('articles');
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const articleUrl = (a: Article | string) => `/${typeof a === 'string' ? a : a.id}/`;
export const categoryUrl = (slug: string, page = 1) =>
  page > 1 ? `/kategoria/${slug}/${page}/` : `/kategoria/${slug}/`;
export const imageUrl = (a: Article) => a.data.image ?? `/images/articles/${a.id}.svg`;
export const ogImageUrl = (a: Article) => `/images/og/${a.id}.jpg`;

const fmt = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' });
export const formatDate = (d: Date) => fmt.format(d);
export const isoDate = (d: Date) => d.toISOString();

export function readingMinutes(body = '') {
  const words = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}

/** Powiązane: najpierw wskazane ręcznie w danych artykułu, potem uzupełnienie z tej samej kategorii. */
export function relatedFor(article: Article, all: Article[], count = 3): Article[] {
  const byId = new Map(all.map((a) => [a.id, a]));
  const picked: Article[] = [];
  for (const id of article.data.related) {
    const r = byId.get(id);
    if (r && r.id !== article.id && !picked.includes(r)) picked.push(r);
  }
  for (const a of all) {
    if (picked.length >= count) break;
    if (a.id !== article.id && a.data.category === article.data.category && !picked.includes(a)) picked.push(a);
  }
  return picked.slice(0, count);
}

export function monthKey(d: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Europe/Warsaw' }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  return { y, m };
}

export const MONTHS_PL = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

export function countByCategory(all: Article[]) {
  return CATEGORIES.map((c) => ({ ...c, count: all.filter((a) => a.data.category === c.slug).length }));
}
