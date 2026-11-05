#!/usr/bin/env node
/**
 * Czwarte, niezależne losowanie 10 klientów dla portalu Przestrzeń Wyboru.
 *
 * - Pełna baza: scripts/client-base.txt (72 adresy), grupowanie adresów tej samej firmy
 *   (Royal Garden Wilanów, Vreespol) – losowanie po FIRMACH.
 * - Każda firma ma JEDNAKOWE szanse (bez preferencji lokalizacji ani branży – w tym bez preferowania firm „lifestyle'owych”).
 * - Algorytm: tasowanie Fishera–Yatesa, generator systemowy (node:crypto randomInt).
 * - Wyniki wcześniejszych portali są wczytywane wyłącznie do ANALIZY różnorodności
 *   (zapisywanej w pliku wynikowym) – nie wpływają na losowanie. Jeżeli wylosowany zestaw
 *   byłby identyczny z którymkolwiek wcześniejszym, losowanie jest powtarzane (zakaz kopiowania zestawów).
 * - Istniejący selected-clients.json blokuje ponowne losowanie (--force, by świadomie powtórzyć).
 */
import { randomInt } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'selected-clients.json');
if (existsSync(out) && !process.argv.includes('--force')) { console.log('selected-clients.json już istnieje – losowanie nie jest powtarzane.'); process.exit(0); }

const urls = readFileSync(path.join(root, 'scripts/client-base.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
const SAME = { 'apartamentyroyalgarden.pl': 'royal-garden-wilanow', 'royalgardenwilanow.pl': 'royal-garden-wilanow', 'vreespol.pl': 'vreespol', 'vreespol.de': 'vreespol' };
const host = (u) => new URL(u).hostname.replace(/^www\./, '').replace(/^sklep\./, '');
const groups = new Map();
for (const u of urls) { const k = SAME[host(u)] ?? host(u); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(u); }

const previous = {};
for (const p of ['mapa-codziennosci', 'horyzont-praktyczny', 'puls-regionow']) {
  const f = path.join(root, '..', p, 'selected-clients.json');
  if (existsSync(f)) previous[p] = JSON.parse(readFileSync(f, 'utf8')).selected.map((s) => s.id);
}

let selected, attempts = 0;
do {
  attempts++;
  const list = [...groups.entries()].map(([id, addresses]) => ({ id, addresses }));
  for (let i = list.length - 1; i > 0; i--) { const j = randomInt(i + 1); [list[i], list[j]] = [list[j], list[i]]; }
  selected = list.slice(0, 10).map((c) => ({ id: c.id, url: c.addresses[randomInt(c.addresses.length)], allAddresses: c.addresses }));
} while (Object.values(previous).some((prev) => prev.length === 10 && prev.every((id) => selected.some((s) => s.id === id))));

const analysis = Object.fromEntries(Object.entries(previous).map(([p, ids]) => [p, selected.filter((s) => ids.includes(s.id)).map((s) => s.id)]));
writeFileSync(out, JSON.stringify({
  drawnAt: new Date().toISOString(),
  method: 'Fisher–Yates, node:crypto randomInt, jednakowe szanse dla wszystkich firm z pełnej bazy',
  baseAddresses: urls.length, baseCompanies: groups.size, attempts,
  diversityAnalysis: { note: 'Wyniki poprzednich losowań użyte wyłącznie do analizy – bez wpływu na szanse firm.', overlapWithPrevious: analysis },
  selected,
}, null, 2) + '\n');
console.log(`Baza: ${urls.length} adresów, ${groups.size} firm. Próby: ${attempts}.`);
selected.forEach((s, i) => console.log(`${i + 1}. ${s.id} -> ${s.url}`));
console.log('Wspólne z poprzednimi:', JSON.stringify(analysis));
