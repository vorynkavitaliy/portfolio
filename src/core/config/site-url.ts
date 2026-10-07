import { z } from 'zod';

import type { EnvSource } from '@/core/config/server-env';

const LOCAL_SITE_URL = 'http://localhost:3000';

const siteUrlSchema = z.url({ protocol: /^https?$/ });

const vercelHostSchema = z.string().regex(/^[a-z0-9.-]+$/i);

const filled = (value: string | undefined): string | undefined => {
  const trimmed: string = (value ?? '').trim();

  return trimmed === '' ? undefined : trimmed;
};

export const resolveSiteUrl = (source: EnvSource): URL => {
  const explicit: string | undefined = filled(source['SITE_URL']);

  if (explicit !== undefined) {
    const parsed = siteUrlSchema.safeParse(explicit);

    if (!parsed.success) {
      throw new Error('Invalid SITE_URL');
    }

    return new URL(parsed.data);
  }

  const vercelHost: string | undefined = filled(source['VERCEL_PROJECT_PRODUCTION_URL']);

  if (vercelHost !== undefined) {
    const parsed = vercelHostSchema.safeParse(vercelHost);

    if (!parsed.success) {
      throw new Error('Invalid VERCEL_PROJECT_PRODUCTION_URL');
    }

    return new URL(`https://${parsed.data}`);
  }

  return new URL(LOCAL_SITE_URL);
};

export const getSiteUrl = (): URL => {
  return resolveSiteUrl(process.env);
};
