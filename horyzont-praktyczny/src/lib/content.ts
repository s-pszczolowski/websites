import { getCollection, type CollectionEntry } from 'astro:content';
import { TOPICS } from '../config/site';

export type Entry = CollectionEntry<'articles'>;

export async function allArticles(): Promise<Entry[]> {
  return (await getCollection('articles')).sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}
export const href = (e: Entry | string) => `/${typeof e === 'string' ? e : e.id}/`;
export const topicHref = (slug: string, page = 1) => (page > 1 ? `/temat/${slug}/strona/${page}/` : `/temat/${slug}/`);
export const listHref = (page = 1) => (page > 1 ? `/publikacje/strona/${page}/` : '/publikacje/');
export const coverOf = (e: Entry) => e.data.cover ?? `/img/${e.id}.svg`;
export const shareImageOf = (e: Entry) => `/img/share/${e.id}.jpg`;

const dayFmt = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Warsaw' });
const longFmt = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' });
export const shortDate = (d: Date) => dayFmt.format(d);
export const longDate = (d: Date) => longFmt.format(d);
export const iso = (d: Date) => d.toISOString();

export const minutes = (body = '') => Math.max(3, Math.round(body.split(/\s+/).filter(Boolean).length / 190));

export function monthOf(d: Date) {
  const s = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Europe/Warsaw' }).format(d);
  return s.slice(0, 7); // RRRR-MM
}
const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
export const monthLabel = (key: string) => `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

export function monthsWithCounts(list: Entry[]) {
  const m = new Map<string, number>();
  for (const e of list) m.set(monthOf(e.data.published), (m.get(monthOf(e.data.published)) || 0) + 1);
  return [...m.entries()].map(([key, count]) => ({ key, count }));
}

export function relatedOf(e: Entry, list: Entry[], n = 3) {
  const map = new Map(list.map((x) => [x.id, x]));
  const out: Entry[] = [];
  for (const id of e.data.related) { const r = map.get(id); if (r && r.id !== e.id && !out.includes(r)) out.push(r); }
  for (const x of list) { if (out.length >= n) break; if (x.id !== e.id && x.data.topic === e.data.topic && !out.includes(x)) out.push(x); }
  return out.slice(0, n);
}

export const topicsWithCounts = (list: Entry[]) => TOPICS.map((t) => ({ ...t, count: list.filter((e) => e.data.topic === t.slug).length }));
