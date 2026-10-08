import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { CASES } from '@tests/front/e2e/seo.cases';

const ALLOWED_SOURCES: readonly string[] = [
  'spec',
  'wcag',
  'playwright-docs',
  'security-md',
  'owner-2026-10-07',
  'owner-2026-10-08',
];

test('every case id has exactly one test and every test id exists', () => {
  const source: string = readFileSync('tests/front/e2e/seo.spec.ts', 'utf8');

  const used: string[] = [...source.matchAll(/caseTitle\(\s*'([^']+)'/g)].map((match) => {
    return match[1] ?? '';
  });

  const known: string[] = CASES.map((entry) => {
    return entry.id;
  });

  expect(
    known.filter((id) => {
      return !used.includes(id);
    }),
  ).toEqual([]);

  expect(
    used.filter((id) => {
      return !known.includes(id);
    }),
  ).toEqual([]);

  expect(new Set(used).size).toBe(used.length);
});

test('every case names an allowed source and a reference', () => {
  for (const entry of CASES) {
    expect(ALLOWED_SOURCES).toContain(entry.source);
    expect(entry.reference).not.toBe('');
  }
});
