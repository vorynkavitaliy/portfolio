import 'server-only';

import { z } from 'zod';

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
