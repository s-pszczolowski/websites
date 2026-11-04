/**
 * Wtyczka rehype: dla linków zewnętrznych w treści artykułów
 *  - linki do stron klientów (z selected-clients.json / bazy) dostają rel="sponsored noopener",
 *  - pozostałe linki zewnętrzne dostają rel="noopener".
 * Dzięki temu oznaczenie linków partnerskich nie zależy od pamięci autora tekstu.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const base = readFileSync(path.join(root, 'scripts/client-base.txt'), 'utf8')
  .split('\n').map((s) => s.trim()).filter(Boolean)
  .map((u) => new URL(u).hostname.replace(/^www\./, ''));
const clientHosts = new Set(base);

function visit(node, fn) {
  fn(node);
  if (node.children) for (const c of node.children) visit(c, fn);
}

export function rehypeExternalLinks() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'element' || node.tagName !== 'a') return;
      const href = String(node.properties?.href ?? '');
      if (!/^https?:\/\//.test(href)) return;
      const host = new URL(href).hostname.replace(/^www\./, '');
      node.properties.rel = clientHosts.has(host) ? ['sponsored', 'noopener'] : ['noopener'];
    });
  };
}
