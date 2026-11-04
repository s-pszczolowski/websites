// rehype: linki do domen z bazy klientów → rel="sponsored noopener"; inne zewnętrzne → rel="noopener".
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const partnerHosts = new Set(readFileSync(path.join(base, 'scripts/client-base.txt'), 'utf8').split('\n').filter(Boolean).map((u) => new URL(u.trim()).hostname.replace(/^www\./, '')));
const each = (node, cb) => { cb(node); for (const c of node.children ?? []) each(c, cb); };
export const relLinks = () => (tree) => each(tree, (n) => {
  if (n.type !== 'element' || n.tagName !== 'a' || !/^https?:/.test(n.properties?.href ?? '')) return;
  n.properties.rel = partnerHosts.has(new URL(n.properties.href).hostname.replace(/^www\./, '')) ? ['sponsored', 'noopener'] : ['noopener'];
});
