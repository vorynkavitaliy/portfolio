/// <reference types="vite/client" />

import { expect, test } from 'vitest';

import { FLIGHT_INPUT_CASES } from '@tests/front/ui/scene/flight-input.cases';
import source from '@tests/front/ui/scene/flight-input.test.tsx?raw';

const ALLOWED_SOURCES: readonly string[] = ['spec', 'prototype', 'owner-2026-10-07'];

test('every case id has a test and every test id exists in the catalogue', () => {
  const used: readonly string[] = [...source.matchAll(/caseTest\(\s*'([^']+)'/g)].map((match) => {
    return match[1] ?? '';
  });

  const known: readonly string[] = FLIGHT_INPUT_CASES.map((entry) => {
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
  for (const entry of FLIGHT_INPUT_CASES) {
    expect(ALLOWED_SOURCES).toContain(entry.source);
    expect(entry.reference).not.toBe('');
  }
});

test('the suite has no focused, skipped or todo tests', () => {
  expect(source).not.toMatch(/\b(test|it|describe)\.(only|skip|todo|fails)\b/);
});
