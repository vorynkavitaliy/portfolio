import type { ServerEnvCaseId } from '@tests/back/core/config/server-env.cases';

export type ServerEnvMutation = Readonly<{
  id: string;
  file: string;
  find: string;
  replace: string;
  nth?: number;
  caseIds: readonly ServerEnvCaseId[];
}>;

const ENV = 'src/core/config/server-env.ts';

export const SERVER_ENV_MUTATIONS: readonly ServerEnvMutation[] = [
  {
    id: 'port.max-raised',
    file: ENV,
    find: 'MAX_PORT = 65535',
    replace: 'MAX_PORT = 65536',
    caseIds: ['sec.env.port.above-range'],
  },
  {
    id: 'port.min-dropped',
    file: ENV,
    find: '.int().min(1).max(MAX_PORT)',
    replace: '.int().min(0).max(MAX_PORT)',
    caseIds: ['sec.env.port.below-range'],
  },
  {
    id: 'port.integer-dropped',
    file: ENV,
    find: 'z.coerce.number().int()',
    replace: 'z.coerce.number()',
    caseIds: ['sec.env.port.not-integer'],
  },
  {
    id: 'contact-to.any-string',
    file: ENV,
    find: 'CONTACT_TO: z.email()',
    replace: 'CONTACT_TO: z.string().min(1)',
    caseIds: ['sec.env.contact-to.not-email'],
  },
  {
    id: 'blank.accepted',
    file: ENV,
    find: 'SMTP_HOST: z.string().min(1)',
    replace: 'SMTP_HOST: z.string()',
    caseIds: ['sec.env.blank-is-missing'],
  },
  {
    id: 'error.leaks-values',
    file: ENV,
    find: "return String(issue.path[0] ?? 'unknown');",
    replace:
      "return `${String(issue.path[0] ?? 'unknown')}=${String(source[String(issue.path[0])])}`;",
    caseIds: ['sec.env.names-only', 'sec.env.names-all', 'sec.env.missing.smtp-host'],
  },
  {
    id: 'cache.disabled',
    file: ENV,
    find: 'cachedEnv ??= parseServerEnv(process.env);',
    replace: 'cachedEnv = parseServerEnv(process.env);',
    caseIds: ['sec.env.cached'],
  },
  {
    id: 'get.ignores-missing-pass',
    file: ENV,
    find: 'cachedEnv ??= parseServerEnv(process.env);',
    replace: "cachedEnv ??= parseServerEnv({ ...process.env, SMTP_PASS: 'filled-in' });",
    caseIds: ['sec.env.get-fails-loudly'],
  },
  {
    id: 'host.optional',
    file: ENV,
    find: 'SMTP_HOST: z.string().min(1)',
    replace: 'SMTP_HOST: z.string().min(1).optional()',
    caseIds: ['sec.env.missing.smtp-host', 'sec.env.names-all'],
  },
  {
    id: 'pass.optional',
    file: ENV,
    find: 'SMTP_PASS: z.string().min(1)',
    replace: 'SMTP_PASS: z.string().min(1).optional()',
    caseIds: ['sec.env.missing.smtp-pass'],
  },
  {
    id: 'ip-header.optional',
    file: ENV,
    find: 'CLIENT_IP_HEADER: z.string().min(1)',
    replace: 'CLIENT_IP_HEADER: z.string().min(1).optional()',
    caseIds: ['sec.env.missing.client-ip-header'],
  },
  {
    id: 'turnstile.secret-optional',
    file: ENV,
    find: 'const turnstileSecretSchema = z.string().trim().min(1);',
    replace: 'const turnstileSecretSchema = z.string().trim();',
    caseIds: ['sec.env.turnstile.secret-missing'],
  },
  {
    id: 'turnstile.secret-untrimmed',
    file: ENV,
    find: 'const turnstileSecretSchema = z.string().trim().min(1);',
    replace: 'const turnstileSecretSchema = z.string().min(1);',
    caseIds: ['sec.env.turnstile.secret-present', 'sec.env.turnstile.secret-missing'],
  },
  {
    id: 'turnstile.test-secret-allowed-in-production',
    file: ENV,
    find: "source['NODE_ENV'] === 'production' &&",
    replace: "source['NODE_ENV'] === 'never' &&",
    caseIds: ['sec.env.turnstile.test-secret-production'],
  },
  {
    id: 'turnstile.test-secret-list-short',
    file: ENV,
    find: "  '3x0000000000000000000000000000000AA',\n",
    replace: '',
    caseIds: ['sec.env.turnstile.test-secret-production'],
  },
  {
    id: 'turnstile.real-secret-refused-in-production',
    file: ENV,
    find: 'isPublicProduction(source) && CLOUDFLARE_TEST_SECRETS.includes(result.data)',
    replace: 'isPublicProduction(source)',
    caseIds: ['sec.env.turnstile.test-secret-production'],
  },
  {
    id: 'turnstile.site-key-blank-kept',
    file: ENV,
    find: 'const turnstileSiteKeySchema = z.string().trim().min(1);',
    replace: 'const turnstileSiteKeySchema = z.string();',
    caseIds: ['sec.env.turnstile.site-key'],
  },
  {
    id: 'turnstile.site-key-from-secret',
    file: ENV,
    find: "safeParse(source['TURNSTILE_SITE_KEY'])",
    replace: "safeParse(source['TURNSTILE_SECRET_KEY'])",
    caseIds: ['sec.env.turnstile.site-key'],
  },
  {
    id: 'turnstile.test-secret-allowed-on-public-host',
    file: ENV,
    find: '!LOOPBACK_HOSTS.includes(resolveSiteUrl(source).hostname)',
    replace: 'LOOPBACK_HOSTS.includes(resolveSiteUrl(source).hostname)',
    caseIds: ['sec.env.turnstile.test-secret-production'],
  },
  {
    id: 'turnstile.loopback-list-short',
    file: ENV,
    find: "['localhost', '127.0.0.1', '[::1]']",
    replace: "['localhost']",
    caseIds: ['sec.env.turnstile.test-secret-production'],
  },
];
