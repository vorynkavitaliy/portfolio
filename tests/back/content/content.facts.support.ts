import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { z } from 'zod';

import { CONTACT_FORM_COPY } from '@/content/contact-form.content';
import { SITE_COPY } from '@/content/site.content';
import { STATIONS_COPY } from '@/content/stations.content';
import { WORLD_COPY } from '@/content/world.content';

export type CopyString = Readonly<{ path: string; text: string }>;

const forbiddenShape = z.object({
  employers: z.array(z.string().min(1)).min(1),
  projects: z.array(z.string().min(1)).min(1),
  clients: z.array(z.string().min(1)).min(1),
  terms: z.array(z.string().min(1)).min(1),
  phones: z.array(z.string().regex(/^\d{7,}$/)).min(1),
});

export type ForbiddenList = z.infer<typeof forbiddenShape>;

export const FORBIDDEN_LIST_PATH: string = resolve(
  process.cwd(),
  'tests/back/content/forbidden.local.json',
);

export const loadForbiddenList = (path: string = FORBIDDEN_LIST_PATH): ForbiddenList => {
  if (!existsSync(path)) {
    throw new Error(
      `Forbidden-names list is missing: create ${path} (gitignored by *.local.json) with the keys employers, projects, clients, terms, phones, built from the CV source dictionary R and the verified-facts memory. The content checks never skip without it.`,
    );
  }

  const parsed = forbiddenShape.safeParse(JSON.parse(readFileSync(path, 'utf8')));

  if (!parsed.success) {
    throw new Error(
      `Forbidden-names list at ${path} is malformed: every key needs a non-empty array of strings (phones: digit strings).`,
    );
  }

  return parsed.data;
};

export const forbiddenNames = (list: ForbiddenList): readonly string[] => {
  return [...list.employers, ...list.projects, ...list.clients];
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const containsTerm = (text: string, term: string): boolean => {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}s?(?![\\p{L}\\p{N}])`, 'iu').test(
    text,
  );
};

const walk = (value: unknown, path: string, out: CopyString[]): void => {
  if (typeof value === 'string') {
    out.push({ path, text: value });

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      walk(entry, `${path}[${index}]`, out);
    });

    return;
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, entry] of Object.entries(value)) {
      walk(entry, path === '' ? key : `${path}.${key}`, out);
    }
  }
};

export const collectStrings = (root: string, value: unknown): readonly CopyString[] => {
  const out: CopyString[] = [];

  walk(value, root, out);

  return out;
};

export const STATION_STRINGS: readonly CopyString[] = collectStrings('stations', STATIONS_COPY);

export const ALL_STRINGS: readonly CopyString[] = [
  ...STATION_STRINGS,
  ...collectStrings('world', WORLD_COPY),
  ...collectStrings('contactForm', CONTACT_FORM_COPY),
  ...collectStrings('site', SITE_COPY),
];

export const FULL_CYCLE_STRINGS: readonly CopyString[] = collectStrings(
  'stations.full-cycle',
  STATIONS_COPY['full-cycle'],
);
