#!/usr/bin/env node
/** Blokuje kompilację produkcyjną, dopóki nie są ustawione SITE_URL i dane właściciela. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(path.join(root, 'deployment.config.json'), 'utf8'));
const problems = [];
const site = process.env.SITE_URL || '';
if (!/^https:\/\/[^/]+$/.test(site.replace(/\/$/, '')) || /localhost/.test(site)) problems.push('SITE_URL musi wskazywać produkcyjną domenę https://… (np. SITE_URL=https://mapacodziennosci.pl)');
if (!cfg.administrator.nazwa) problems.push('deployment.config.json: administrator.nazwa');
if (!cfg.administrator.adres) problems.push('deployment.config.json: administrator.adres');
if (!cfg.kontakt.email_redakcji) problems.push('deployment.config.json: kontakt.email_redakcji');
if (!cfg.daty_publikacji_potwierdzone) problems.push('deployment.config.json: daty_publikacji_potwierdzone – daty w artykułach są demonstracyjne; zastąp je rzeczywistymi datami publikacji i ustaw true');
if (problems.length) {
  console.error('Kompilacja produkcyjna wstrzymana. Uzupełnij:\n' + problems.map((p) => ' - ' + p).join('\n'));
  process.exit(1);
}
console.log('Konfiguracja wdrożeniowa kompletna.');
