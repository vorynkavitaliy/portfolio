import 'server-only';

export const CONTACT_SUBJECT_PREFIX = 'Portfolio contact:';

export const SUBJECT_NAME_MAX = 80;

export const SMTPS_PORT = 465;

export const SMTP_TIMEOUTS_MS = { connection: 10_000, greeting: 10_000, socket: 20_000 } as const;

export const MAIL_FAILED_LOG = 'contact.mail.failed';

export const UNKNOWN_MAIL_ERROR = 'UNKNOWN';

export const AUTO_REPLY_FAILED_LOG = 'contact.autoreply.failed';
