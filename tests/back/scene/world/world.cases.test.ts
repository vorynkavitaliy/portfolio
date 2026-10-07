import { readFileSync } from 'node:fs';

import { expect, test } from 'vitest';

import { WORLD_CASES } from '@tests/back/scene/world/world.cases';

const ALLOWED_SOURCES: readonly string[] = ['prototype', 'spec', 'owner-2026-10-07', 'three-docs'];

const TEST_FILE = 'tests/back/scene/world/world.test.ts';

test('every case id has a test and every test id exists in the catalogue', () => {
  const source: string = readFileSync(TEST_FILE, 'utf8');

  const used: readonly string[] = [...source.matchAll(/caseTest\(\s*'([^']+)'/g)].map((match) => {
    return match[1] ?? '';
  });

  const known: readonly string[] = WORLD_CASES.map((entry) => {
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
  const ids: readonly string[] = WORLD_CASES.map((entry) => {
    return entry.id;
  });

  expect(new Set(ids).size).toBe(ids.length);
});

test('every case names an allowed source and a reference', () => {
  for (const entry of WORLD_CASES) {
    expect(ALLOWED_SOURCES).toContain(entry.source);
    expect(entry.reference).not.toBe('');
    expect(entry.expected).not.toBe('');
  }
});

test('the test file has no only, skip or todo', () => {
  const source: string = readFileSync(TEST_FILE, 'utf8');

  expect(source).not.toMatch(/\.(only|skip|todo)\b/);
});
