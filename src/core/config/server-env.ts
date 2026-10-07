import 'server-only';

import { z } from 'zod';

import { resolveSiteUrl } from '@/core/config/site-url';

const MAX_PORT = 65535;

const serverEnvSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(MAX_PORT),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  CONTACT_FROM: z.string().min(1),
  CONTACT_TO: z.email(),
  CLIENT_IP_HEADER: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export type EnvSource = Readonly<Record<string, string | undefined>>;

export const parseServerEnv = (source: EnvSource): ServerEnv => {
  const result = serverEnvSchema.safeParse(source);

  if (result.success) {
    return result.data;
  }

  const names: string[] = result.error.issues.map((issue) => {
    return String(issue.path[0] ?? 'unknown');
  });

  throw new Error(`Invalid server environment: ${names.join(', ')}`);
};

let cachedEnv: ServerEnv | null = null;

export const getServerEnv = (): ServerEnv => {
  cachedEnv ??= parseServerEnv(process.env);

  return cachedEnv;
};

export const CLOUDFLARE_TEST_SECRETS: readonly string[] = [
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
];

const LOOPBACK_HOSTS: readonly string[] = ['localhost', '127.0.0.1', '[::1]'];

const isPublicProduction = (source: EnvSource): boolean => {
  return (
    source['NODE_ENV'] === 'production' && !LOOPBACK_HOSTS.includes(resolveSiteUrl(source).hostname)
  );
};

const turnstileSecretSchema = z.string().trim().min(1);

const turnstileSiteKeySchema = z.string().trim().min(1);

export const parseTurnstileSecret = (source: EnvSource): string => {
  const result = turnstileSecretSchema.safeParse(source['TURNSTILE_SECRET_KEY']);

  if (!result.success) {
    throw new Error('Invalid server environment: TURNSTILE_SECRET_KEY');
  }

  if (isPublicProduction(source) && CLOUDFLARE_TEST_SECRETS.includes(result.data)) {
    throw new Error('Invalid server environment: TURNSTILE_SECRET_KEY is a test key');
  }

  return result.data;
};

export const getTurnstileSecret = (): string => {
  return parseTurnstileSecret(process.env);
};

export const parseTurnstileSiteKey = (source: EnvSource): string | null => {
  const result = turnstileSiteKeySchema.safeParse(source['TURNSTILE_SITE_KEY']);

  return result.success ? result.data : null;
};

export const getTurnstileSiteKey = (): string | null => {
  return parseTurnstileSiteKey(process.env);
};
