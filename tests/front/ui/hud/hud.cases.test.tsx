/// <reference types="vite/client" />

import { expect, test } from 'vitest';

import { HUD_CASES } from '@tests/front/ui/hud/hud.cases';
import source from '@tests/front/ui/hud/hud.test.tsx?raw';

const ALLOWED_SOURCES: readonly string[] = ['spec', 'owner-2026-10-07', 'prototype', 'apg'];

test('every case id has a test and every test id exists in the catalogue', () => {
  const used: readonly string[] = [...source.matchAll(/caseTest\(\s*'([^']+)'/g)].map((match) => {
    return match[1] ?? '';
  });

  const known: readonly string[] = HUD_CASES.map((entry) => {
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
  for (const entry of HUD_CASES) {
    expect(ALLOWED_SOURCES).toContain(entry.source);
    expect(entry.reference).not.toBe('');
  }
});

test('the suite has no focused, skipped or todo tests', () => {
  expect(source).not.toMatch(/\b(test|it|describe)\.(only|skip|todo|fails)\b/);
});
