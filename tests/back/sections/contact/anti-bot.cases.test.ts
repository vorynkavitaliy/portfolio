import { readFileSync } from 'node:fs';

import { expect, test } from 'vitest';

import { ANTI_BOT_CASES } from '@tests/back/sections/contact/anti-bot.cases';

const ALLOWED_SOURCES: readonly string[] = ['security-md', 'spec', 'owner-2026-10-07'];

const TEST_FILE = 'tests/back/sections/contact/anti-bot.test.ts';

test('every case id has a test and every test id exists in the catalogue', () => {
  const source: string = readFileSync(TEST_FILE, 'utf8');

  const used: readonly string[] = [...source.matchAll(/caseTest\(\s*'([^']+)'/g)].map((match) => {
    return match[1] ?? '';
  });

  const known: readonly string[] = ANTI_BOT_CASES.map((entry) => {
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

test('case ids are unique', () => {
  const ids: readonly string[] = ANTI_BOT_CASES.map((entry) => {
    return entry.id;
  });

  expect(new Set(ids).size).toBe(ids.length);
});

test('every case names an allowed source and a reference', () => {
  for (const entry of ANTI_BOT_CASES) {
    expect(ALLOWED_SOURCES).toContain(entry.source);
    expect(entry.reference).not.toBe('');
  }
});
