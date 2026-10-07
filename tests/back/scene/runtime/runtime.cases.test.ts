import { readdirSync, readFileSync } from 'node:fs';

import { expect, test } from 'vitest';

import { RUNTIME_CASES } from '@tests/back/scene/runtime/runtime.cases';

const ALLOWED_SOURCES: readonly string[] = [
  'prototype',
  'spec',
  'scene-rule',
  'motion-tokens',
  'owner-2026-10-07',
  'three-docs',
];

const DIR = 'tests/back/scene/runtime';

const testFiles = (): readonly string[] => {
  return readdirSync(DIR)
    .filter((name) => {
      return name.endsWith('.test.ts') && !name.endsWith('.cases.test.ts');
    })
    .map((name) => {
      return `${DIR}/${name}`;
    });
};

test('every case id has a test and every test id exists in the catalogue', () => {
  const used: readonly string[] = testFiles().flatMap((file) => {
    return [...readFileSync(file, 'utf8').matchAll(/caseTest\(\s*'([^']+)'/g)].map((match) => {
      return match[1] ?? '';
    });
  });

  const known: readonly string[] = RUNTIME_CASES.map((entry) => {
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
  const ids: readonly string[] = RUNTIME_CASES.map((entry) => {
    return entry.id;
  });

  expect(new Set(ids).size).toBe(ids.length);
});

test('every case names an allowed source and a reference', () => {
  for (const entry of RUNTIME_CASES) {
    expect(ALLOWED_SOURCES).toContain(entry.source);
    expect(entry.reference).not.toBe('');
  }
});
