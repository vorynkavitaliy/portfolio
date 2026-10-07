export type ServerEnvCaseSource =
  'security-md' | 'rfc-6335' | 'owner-2026-10-07' | 'cloudflare-docs';

export type ServerEnvCase = Readonly<{
  id: string;
  source: ServerEnvCaseSource;
  reference: string;
  expected: string;
}>;

const SECURITY_SECRETS =
  'rules/security.md §2 «Secrets» (validated by zod at start, missing fails loudly)';

const CONTACT_ENV = 'rules/security.md §2 «Secrets» (SMTP and contact variables)';

const OWNER_ENV = 'owner decision 2026-10-07 (env contract of the contact form)';

const TURNSTILE_ENV =
  'owner decision 2026-10-07 (Turnstile: TURNSTILE_SECRET_KEY server-only, TURNSTILE_SITE_KEY public, passed as a prop)';

const TURNSTILE_TESTING =
  'cloudflare-docs https://developers.cloudflare.com/turnstile/troubleshooting/testing/ (test secrets 1x…AA, 2x…AA, 3x…AA)';

const PORTS = 'RFC 6335 §6 (ports are 16-bit integers, 0 reserved)';

export const SERVER_ENV_CASES = [
  {
    id: 'sec.env.all-present',
    source: 'security-md',
    reference: CONTACT_ENV,
    expected:
      'with all seven variables present the parsed values equal the input and the port is the number 587',
  },
  {
    id: 'sec.env.missing.smtp-host',
    source: 'security-md',
    reference: SECURITY_SECRETS,
    expected: 'without SMTP_HOST the error names SMTP_HOST',
  },
  {
    id: 'sec.env.missing.smtp-port',
    source: 'security-md',
    reference: SECURITY_SECRETS,
    expected: 'without SMTP_PORT the error names SMTP_PORT',
  },
  {
    id: 'sec.env.missing.smtp-user',
    source: 'security-md',
    reference: SECURITY_SECRETS,
    expected: 'without SMTP_USER the error names SMTP_USER',
  },
  {
    id: 'sec.env.missing.smtp-pass',
    source: 'security-md',
    reference: SECURITY_SECRETS,
    expected: 'without SMTP_PASS the error names SMTP_PASS',
  },
  {
    id: 'sec.env.missing.contact-from',
    source: 'security-md',
    reference: SECURITY_SECRETS,
    expected: 'without CONTACT_FROM the error names CONTACT_FROM',
  },
  {
    id: 'sec.env.missing.contact-to',
    source: 'security-md',
    reference: SECURITY_SECRETS,
    expected: 'without CONTACT_TO the error names CONTACT_TO',
  },
  {
    id: 'sec.env.missing.client-ip-header',
    source: 'owner-2026-10-07',
    reference: OWNER_ENV,
    expected: 'without CLIENT_IP_HEADER the error names CLIENT_IP_HEADER',
  },
  {
    id: 'sec.env.blank-is-missing',
    source: 'security-md',
    reference: `${SECURITY_SECRETS}; .env.example lists names with empty values`,
    expected: 'an empty SMTP_HOST counts as missing and the error names SMTP_HOST',
  },
  {
    id: 'sec.env.port.non-numeric',
    source: 'security-md',
    reference: `${CONTACT_ENV} (SMTP_PORT is a port number)`,
    expected: 'a SMTP_PORT of «abc» fails and names SMTP_PORT',
  },
  {
    id: 'sec.env.port.below-range',
    source: 'rfc-6335',
    reference: PORTS,
    expected: 'a SMTP_PORT of 0 fails and names SMTP_PORT',
  },
  {
    id: 'sec.env.port.above-range',
    source: 'rfc-6335',
    reference: PORTS,
    expected: 'a SMTP_PORT of 65536 fails and names SMTP_PORT',
  },
  {
    id: 'sec.env.port.not-integer',
    source: 'rfc-6335',
    reference: PORTS,
    expected: 'a SMTP_PORT of 587.5 fails and names SMTP_PORT',
  },
  {
    id: 'sec.env.port.smtps',
    source: 'owner-2026-10-07',
    reference: `${OWNER_ENV}; 465 is accepted as SMTPS`,
    expected: 'a SMTP_PORT of 465 is accepted as the number 465',
  },
  {
    id: 'sec.env.contact-to.not-email',
    source: 'security-md',
    reference: `${CONTACT_ENV} (CONTACT_TO is the owner inbox)`,
    expected: 'a CONTACT_TO that is not an email address fails and names CONTACT_TO',
  },
  {
    id: 'sec.env.names-all',
    source: 'security-md',
    reference: SECURITY_SECRETS,
    expected: 'with SMTP_HOST missing and SMTP_PORT invalid the error names both once each',
  },
  {
    id: 'sec.env.names-only',
    source: 'security-md',
    reference: 'rules/security.md §2 «No secret … in logs»',
    expected: 'the error for an invalid value never contains the supplied values',
  },
  {
    id: 'sec.env.cached',
    source: 'owner-2026-10-07',
    reference: 'owner decision 2026-10-07: getServerEnv() is cached',
    expected:
      'two calls to getServerEnv return the same object and a later change of process.env is not seen',
  },
  {
    id: 'sec.env.get-fails-loudly',
    source: 'security-md',
    reference: SECURITY_SECRETS,
    expected: 'getServerEnv throws naming the variable when process.env lacks SMTP_PASS',
  },
  {
    id: 'sec.env.turnstile.secret-present',
    source: 'owner-2026-10-07',
    reference: TURNSTILE_ENV,
    expected: 'a TURNSTILE_SECRET_KEY with surrounding spaces is returned trimmed',
  },
  {
    id: 'sec.env.turnstile.secret-missing',
    source: 'security-md',
    reference: `${SECURITY_SECRETS}; ${TURNSTILE_ENV}`,
    expected:
      'a missing or blank TURNSTILE_SECRET_KEY throws naming TURNSTILE_SECRET_KEY and never its value; getTurnstileSecret reads process.env',
  },
  {
    id: 'sec.env.turnstile.test-secret-production',
    source: 'cloudflare-docs',
    reference: `${TURNSTILE_TESTING}; ${SECURITY_SECRETS}; owner deploy 2026-10-07 (self-hosted VPS, no VERCEL_ENV)`,
    expected:
      'each of the three Cloudflare test secrets throws when NODE_ENV is production and SITE_URL is a public host, and is accepted when NODE_ENV is production on localhost, 127.0.0.1 or [::1] (e2e) or when NODE_ENV is not production; a real secret is accepted on the public host',
  },
  {
    id: 'sec.env.turnstile.site-key',
    source: 'owner-2026-10-07',
    reference: TURNSTILE_ENV,
    expected:
      'a TURNSTILE_SITE_KEY is returned trimmed; a missing or blank one gives null instead of throwing; getTurnstileSiteKey reads process.env',
  },
] as const satisfies readonly ServerEnvCase[];

export type ServerEnvCaseId = (typeof SERVER_ENV_CASES)[number]['id'];
