#!/usr/bin/env node
/**
 * Jednorazowe, niezależne losowanie 10 klientów dla portalu Horyzont Praktyczny.
 *
 * - Baza: scripts/client-base.txt (72 adresy). Adresy tej samej firmy są grupowane
 *   (Royal Garden Wilanów, Vreespol) – losujemy FIRMY, nie adresy.
 * - Punkt odniesienia: ../mapa-codziennosci/selected-clients.json (jeśli istnieje).
 *   Firmy wylosowane wcześniej NIE są wykluczane, ale mają niższą wagę (PREV_WEIGHT),
 *   więc losowanie preferuje firmy jeszcze niewykorzystane, pozostając losowaniem.
 * - Algorytm: ważone losowanie bez zwracania (Efraimidis–Spirakis: klucz = u^(1/w),
 *   u z systemowego CSPRNG – crypto.randomInt), następnie wybór 10 największych kluczy.
 *   Przy równych wagach jest to równoważne tasowaniu Fishera–Yatesa.
 * - Wynik: selected-clients.json. Istniejący plik blokuje ponowne losowanie
 *   (świadome powtórzenie: --force).
 */
import { randomInt } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'selected-clients.json');
const COUNT = 10;
const PREV_WEIGHT = 0.25;

if (existsSync(out) && !process.argv.includes('--force')) {
  console.log('selected-clients.json już istnieje – losowanie nie jest powtarzane.');
  process.exit(0);
}

const urls = readFileSync(path.join(root, 'scripts/client-base.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
const SAME_COMPANY = {
  'apartamentyroyalgarden.pl': 'royal-garden-wilanow', 'royalgardenwilanow.pl': 'royal-garden-wilanow',
  'vreespol.pl': 'vreespol', 'vreespol.de': 'vreespol',
};
const host = (u) => new URL(u).hostname.replace(/^www\./, '').replace(/^sklep\./, '');
const groups = new Map();
for (const url of urls) {
  const key = SAME_COMPANY[host(url)] ?? host(url);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(url);
}

const refPath = path.join(root, '../mapa-codziennosci/selected-clients.json');
const previous = existsSync(refPath) ? JSON.parse(readFileSync(refPath, 'utf8')).selected.map((s) => s.id) : [];
const prevSet = new Set(previous);

const uniform = () => (randomInt(1, 2 ** 48 - 1)) / 2 ** 48; // (0,1)
const ranked = [...groups.entries()].map(([id, addresses]) => {
  const weight = prevSet.has(id) ? PREV_WEIGHT : 1;
  return { id, addresses, weight, key: Math.pow(uniform(), 1 / weight) };
}).sort((a, b) => b.key - a.key);

const selected = ranked.slice(0, COUNT).map((c) => ({
  id: c.id,
  url: c.addresses[randomInt(c.addresses.length)],
  allAddresses: c.addresses,
  drawnPreviouslyInMapaCodziennosci: prevSet.has(c.id),
}));

writeFileSync(out, JSON.stringify({
  drawnAt: new Date().toISOString(),
  method: 'Ważone losowanie bez zwracania (Efraimidis–Spirakis, node:crypto randomInt), po firmach',
  baseAddresses: urls.length,
  baseCompanies: groups.size,
  reference: previous.length ? { file: '../mapa-codziennosci/selected-clients.json', previouslyDrawn: previous, weightForPreviouslyDrawn: PREV_WEIGHT } : null,
  selected,
}, null, 2) + '\n');
console.log(`Baza: ${urls.length} adresów, ${groups.size} firm; poprzednio wylosowane: ${previous.length} (waga ${PREV_WEIGHT}).`);
selected.forEach((s, i) => console.log(`${i + 1}. ${s.id} -> ${s.url}${s.drawnPreviouslyInMapaCodziennosci ? '  (powtórzenie)' : ''}`));
