// rehype: linki do domen z bazy klientów dostają rel="sponsored noopener", pozostałe zewnętrzne – rel="noopener".
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const clientHosts = new Set(readFileSync(path.join(projectRoot, 'scripts/client-base.txt'), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean).map((u) => new URL(u).hostname.replace(/^www\./, '')));
function visit(node, fn) { fn(node); (node.children || []).forEach((child) => visit(child, fn)); }
export function relAttrs() {
  return (tree) => visit(tree, (node) => {
    if (node.type !== 'element' || node.tagName !== 'a') return;
    const href = String(node.properties?.href || '');
    if (!/^https?:\/\//.test(href)) return;
    const host = new URL(href).hostname.replace(/^www\./, '');
    node.properties.rel = clientHosts.has(host) ? 'sponsored noopener' : 'noopener';
  });
}
