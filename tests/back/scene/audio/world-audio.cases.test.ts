import { readFileSync } from 'node:fs';

import { expect, test } from 'vitest';

import { WORLD_AUDIO_CASES } from '@tests/back/scene/audio/world-audio.cases';

const TEST_FILE = 'tests/back/scene/audio/world-audio.test.ts';

test('every case id has a test and every test id exists in the catalogue', () => {
  const source: string = readFileSync(TEST_FILE, 'utf8');

  const used: readonly string[] = [...source.matchAll(/caseTest\(\s*'([^']+)'/g)].map((match) => {
    return match[1] ?? '';
  });

  const known: readonly string[] = WORLD_AUDIO_CASES.map((entry) => {
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

test('case ids are unique and each names a reference', () => {
  const ids: readonly string[] = WORLD_AUDIO_CASES.map((entry) => {
    return entry.id;
  });

  expect(new Set(ids).size).toBe(ids.length);

  for (const entry of WORLD_AUDIO_CASES) {
    expect(['prototype', 'spec']).toContain(entry.source);
    expect(entry.reference).not.toBe('');
  }
});
