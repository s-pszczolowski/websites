import { getCollection, type CollectionEntry } from 'astro:content';
import { SECTIONS, REGIONS } from '../config/portal';
export type Story = CollectionEntry<'articles'>;

export const stories = async (): Promise<Story[]> => (await getCollection('articles')).sort((a, b) => +b.data.date - +a.data.date);
export const link = (s: Story | string) => `/${typeof s === 'string' ? s : s.id}/`;
export const sectionLink = (slug: string, n = 1) => (n > 1 ? `/dzial/${slug}/${n}/` : `/dzial/${slug}/`);
export const listLink = (n = 1) => (n > 1 ? `/najnowsze/${n}/` : '/najnowsze/');
export const picture = (s: Story) => s.data.picture ?? `/grafika/${s.id}.svg`;
export const sharePicture = (s: Story) => `/grafika/udostepnianie/${s.id}.jpg`;

const tz = 'Europe/Warsaw';
export const dateLong = (d: Date) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: tz }).format(d);
export const dateShort = (d: Date) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', timeZone: tz }).format(d);
export const isoDate = (d: Date) => d.toISOString();
export const yearMonth = (d: Date) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: tz }).format(d).slice(0, 7);
const MIES = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
export const monthName = (ym: string) => `${MIES[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;
export const months = (all: Story[]) => [...new Set(all.map((s) => yearMonth(s.data.date)))].map((ym) => ({ ym, count: all.filter((s) => yearMonth(s.data.date) === ym).length }));
export const readTime = (body = '') => Math.max(2, Math.round(body.split(/\s+/).length / 200));
export const sectionCounts = (all: Story[]) => SECTIONS.map((s) => ({ ...s, count: all.filter((x) => x.data.section === s.slug).length }));
export const regionCounts = (all: Story[]) => REGIONS.map((r) => ({ ...r, count: all.filter((x) => x.data.region === r.slug).length }));
export function relatedTo(s: Story, all: Story[]) {
  const byId = new Map(all.map((x) => [x.id, x]));
  const out = s.data.related.map((id) => byId.get(id)).filter((x): x is Story => !!x && x.id !== s.id);
  for (const x of all) { if (out.length >= 3) break; if (x.id !== s.id && x.data.section === s.data.section && !out.includes(x)) out.push(x); }
  return out.slice(0, 3);
}
