import cfg from '../../deployment.config.json';
/** Czy wydawca uzupełnił dane wymagane na stronach prawnych. */
export const publisherReady = Boolean(cfg.wydawca?.nazwa && cfg.wydawca?.adres && cfg.kontakt?.email_redakcji);
export const deployment = cfg;
