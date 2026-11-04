import cfg from '../../deployment.config.json';
export const DEPLOY = cfg;
export const ownerReady = Boolean(cfg.wydawca.nazwa && cfg.wydawca.adres && cfg.kontakt.email);
