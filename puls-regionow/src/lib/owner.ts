import cfg from '../../deployment.config.json';
export const OWNER = cfg;
export const ownerFilled = Boolean(cfg.wydawca.nazwa && cfg.wydawca.adres && cfg.redakcja.email);
