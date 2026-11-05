#!/usr/bin/env node
/** Wstrzymuje kompilację produkcyjną magazynu, dopóki nie są ustawione SITE_URL, dane wydawcy i rzeczywiste daty publikacji. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(path.join(root, 'deployment.config.json'), 'utf8'));
const site = (process.env.SITE_URL || '').replace(/\/$/, '');
const missing = [];
if (!/^https:\/\/[^/]+$/.test(site) || /localhost|127\.0\.0\.1/.test(site)) missing.push('SITE_URL – docelowa domena https://… (np. SITE_URL=https://twoja-domena.pl)');
if (!cfg.wydawca?.nazwa) missing.push('deployment.config.json: wydawca.nazwa');
if (!cfg.wydawca?.adres) missing.push('deployment.config.json: wydawca.adres');
if (!cfg.kontakt?.email_redakcji) missing.push('deployment.config.json: kontakt.email_redakcji');
if (!cfg.daty_demonstracyjne_zastapione) missing.push('deployment.config.json: daty_demonstracyjne_zastapione – zastąp daty demonstracyjne w plikach tekstów rzeczywistymi datami publikacji i ustaw true');
if (missing.length) { console.error('Kompilacja produkcyjna wstrzymana. Uzupełnij:\n' + missing.map((m) => ' - ' + m).join('\n')); process.exit(1); }
console.log('Konfiguracja wdrożeniowa kompletna.');
