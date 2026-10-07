import { GLYPHS } from '@/scene/world/world.constants';

import type { WorldRequest } from '@/scene/world/world.types';

const GLYPH_LINE = new RegExp(`^[${Object.keys(GLYPHS).join('')}]+$`);

const MIN_LINES = 1;
const MAX_LINES = 3;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => {
  return typeof value === 'object' && value !== null;
};

export const parseWorldRequest = (raw: unknown): WorldRequest | null => {
  if (!isRecord(raw)) {
    return null;
  }

  const { skyName } = raw;

  if (!Array.isArray(skyName) || skyName.length < MIN_LINES || skyName.length > MAX_LINES) {
    return null;
  }

  const lines: string[] = [];

  for (const line of skyName as unknown[]) {
    if (typeof line !== 'string' || !GLYPH_LINE.test(line)) {
      return null;
    }

    lines.push(line);
  }

  return { skyName: lines };
};
