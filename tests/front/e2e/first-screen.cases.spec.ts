import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { FIRST_SCREEN_CASES } from '@tests/front/e2e/first-screen.cases';

const ALLOWED_SOURCES: readonly string[] = [
  'security-md',
  'spec',
  'wcag',
  'playwright-docs',
  'owner-2026-10-07',
  'owner-question:Q-6',
];

test('every case id has exactly one test and every test id exists', () => {
  const source: string = readFileSync('tests/front/e2e/first-screen.spec.ts', 'utf8');

  const used: string[] = [...source.matchAll(/caseTitle\(\s*'([^']+)'/g)].map((match) => {
    return match[1] ?? '';
  });

  const known: string[] = FIRST_SCREEN_CASES.map((entry) => {
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
  for (const entry of FIRST_SCREEN_CASES) {
    expect(ALLOWED_SOURCES).toContain(entry.source);
    expect(entry.reference).not.toBe('');
  }
});
