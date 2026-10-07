import { readFileSync } from 'node:fs';

import { expect, test } from 'vitest';

import { DOCKING_CASES } from '@tests/back/scene/flight/docking.cases';

const ALLOWED_SOURCES: readonly string[] = ['prototype', 'spec', 'scene-rule'];

const TEST_FILE = 'tests/back/scene/flight/docking.test.ts';

test('every case id has a test and every test id exists in the catalogue', () => {
  const source: string = readFileSync(TEST_FILE, 'utf8');

  const used: readonly string[] = [...source.matchAll(/caseTest\(\s*'([^']+)'/g)].map((match) => {
    return match[1] ?? '';
  });

  const known: readonly string[] = DOCKING_CASES.map((entry) => {
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
  const ids: readonly string[] = DOCKING_CASES.map((entry) => {
    return entry.id;
  });

  expect(new Set(ids).size).toBe(ids.length);
});

test('every case names an allowed source and a reference', () => {
  for (const entry of DOCKING_CASES) {
    expect(ALLOWED_SOURCES).toContain(entry.source);
    expect(entry.reference).not.toBe('');
  }
});
