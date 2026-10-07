import 'server-only';

import { z } from 'zod';

import type { EnvSource } from '@/core/config/server-env';

const cvUrlSchema = z.url({ protocol: /^https?$/ });

export const parseCvHref = (source: EnvSource): string | null => {
  const raw: string = (source['CV_URL'] ?? '').trim();

  if (raw === '') {
    return null;
  }

  const parsed = cvUrlSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error('Invalid server environment: CV_URL');
  }

  return parsed.data;
};

export const getCvHref = (): string | null => {
  return parseCvHref(process.env);
};
