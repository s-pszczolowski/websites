/**
 * rehype: linki do domen z bazy klientów → rel="sponsored noopener" i data-partner;
 * pozostałe linki zewnętrzne → rel="noopener".
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const hosts = new Set(readFileSync(path.join(root, 'scripts/client-base.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean).map((u) => new URL(u).hostname.replace(/^www\./, '')));

const walk = (n, fn) => { fn(n); (n.children || []).forEach((c) => walk(c, fn)); };
export function markExternalLinks() {
  return (tree) => walk(tree, (n) => {
    if (n.type !== 'element' || n.tagName !== 'a') return;
    const href = String(n.properties?.href || '');
    if (!/^https?:\/\//.test(href)) return;
    const partner = hosts.has(new URL(href).hostname.replace(/^www\./, ''));
    n.properties.rel = partner ? ['sponsored', 'noopener'] : ['noopener'];
    if (partner) n.properties.dataPartner = '';
  });
}
