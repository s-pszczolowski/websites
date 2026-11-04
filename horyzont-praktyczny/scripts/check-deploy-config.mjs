#!/usr/bin/env node
/** Blokuje kompilację produkcyjną, dopóki nie są ustawione SITE_URL i dane wydawcy. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(path.join(root, 'deployment.config.json'), 'utf8'));
const site = (process.env.SITE_URL || '').replace(/\/$/, '');
const missing = [];
if (!/^https:\/\/[^/]+$/.test(site) || /localhost/.test(site)) missing.push('SITE_URL – produkcyjna domena https://… (np. SITE_URL=https://horyzontpraktyczny.pl)');
if (!cfg.wydawca.nazwa) missing.push('deployment.config.json: wydawca.nazwa');
if (!cfg.wydawca.adres) missing.push('deployment.config.json: wydawca.adres');
if (!cfg.kontakt.email) missing.push('deployment.config.json: kontakt.email');
if (!cfg.daty_publikacji_zweryfikowane) missing.push('deployment.config.json: daty_publikacji_zweryfikowane – daty artykułów są demonstracyjne; wpisz rzeczywiste daty publikacji i ustaw true');
if (missing.length) { console.error('Kompilacja produkcyjna wstrzymana. Uzupełnij:\n' + missing.map((m) => ' - ' + m).join('\n')); process.exit(1); }
console.log('Konfiguracja wdrożeniowa kompletna.');
