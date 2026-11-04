import config from '../../deployment.config.json';

export const DEPLOY = config;

/** Czy właściciel uzupełnił dane wymagane na stronach prawnych i kontaktowych. */
export const ownerDataComplete = Boolean(
  config.administrator.nazwa && config.administrator.adres && config.kontakt.email_redakcji,
);
