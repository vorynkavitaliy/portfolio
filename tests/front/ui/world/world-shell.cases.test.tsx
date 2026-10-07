/// <reference types="vite/client" />

import { expect, test } from 'vitest';

import { WORLD_SHELL_CASES } from '@tests/front/ui/world/world-shell.cases';
import hudChunkSource from '@tests/front/ui/world/world-shell-hud-chunk.test.tsx?raw';
import shellSource from '@tests/front/ui/world/world-shell.test.tsx?raw';

const source: string = `${shellSource}\n${hudChunkSource}`;

const ALLOWED_SOURCES: readonly string[] = ['spec', 'owner-2026-10-07', 'prototype', 'apg'];

test('every case id has a test and every test id exists in the catalogue', () => {
  const used: readonly string[] = [...source.matchAll(/caseTest\(\s*'([^']+)'/g)].map((match) => {
    return match[1] ?? '';
  });

  const known: readonly string[] = WORLD_SHELL_CASES.map((entry) => {
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
  for (const entry of WORLD_SHELL_CASES) {
    expect(ALLOWED_SOURCES).toContain(entry.source);
    expect(entry.reference).not.toBe('');
  }
});

test('the suite has no focused, skipped or todo tests', () => {
  expect(source).not.toMatch(/\b(test|it|describe)\.(only|skip|todo|fails)\b/);
});
