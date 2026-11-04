#!/usr/bin/env node
/**
 * Jednorazowe losowanie 10 klientów z zamkniętej bazy adresów (scripts/client-base.txt).
 *
 * - Adresy należące do tej samej firmy są grupowane (np. Royal Garden Wilanów, Vreespol),
 *   więc losowanie odbywa się po FIRMACH, a nie po adresach.
 * - Losowanie: tasowanie Fishera–Yatesa z systemowym generatorem (crypto.randomInt).
 * - Wynik zapisywany jest do selected-clients.json. Jeżeli plik istnieje, skrypt NIE losuje
 *   ponownie (kontynuacja projektu korzysta z zapisanego wyniku). Nowe losowanie wymaga
 *   świadomego usunięcia pliku: node scripts/draw-clients.mjs --force
 */
import { randomInt } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'selected-clients.json');
const COUNT = 10;

if (existsSync(out) && !process.argv.includes('--force')) {
  console.log('selected-clients.json już istnieje – losowanie nie jest powtarzane.');
  process.exit(0);
}

const urls = readFileSync(path.join(root, 'scripts/client-base.txt'), 'utf8')
  .split('\n').map((s) => s.trim()).filter(Boolean);

// Adresy, które wskazują tę samą firmę/markę.
const SAME_COMPANY = {
  'apartamentyroyalgarden.pl': 'royal-garden-wilanow',
  'royalgardenwilanow.pl': 'royal-garden-wilanow',
  'vreespol.pl': 'vreespol',
  'vreespol.de': 'vreespol',
};

const host = (u) => new URL(u).hostname.replace(/^www\./, '').replace(/^sklep\./, '');
const groups = new Map();
for (const url of urls) {
  const h = host(url);
  const key = SAME_COMPANY[h] ?? h;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(url);
}

const companies = [...groups.entries()].map(([id, addresses]) => ({ id, addresses }));
// Fisher–Yates
for (let i = companies.length - 1; i > 0; i--) {
  const j = randomInt(i + 1);
  [companies[i], companies[j]] = [companies[j], companies[i]];
}
const selected = companies.slice(0, COUNT).map((c) => ({
  id: c.id,
  url: c.addresses[randomInt(c.addresses.length)],
  allAddresses: c.addresses,
}));

const result = {
  drawnAt: new Date().toISOString(),
  method: 'Fisher–Yates shuffle, node:crypto randomInt (CSPRNG), losowanie bez zwracania po firmach',
  baseAddresses: urls.length,
  baseCompanies: companies.length,
  groupedCompanies: Object.values(SAME_COMPANY).filter((v, i, a) => a.indexOf(v) === i),
  selected,
};
writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(`Baza: ${urls.length} adresów, ${companies.length} firm. Wylosowano:`);
selected.forEach((s, i) => console.log(`${i + 1}. ${s.id} -> ${s.url}`));
