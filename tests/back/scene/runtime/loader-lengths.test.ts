import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/runtime/runtime.case-test';
import { realData } from '@tests/back/scene/world/world.fixture';
import { parseWorldMessage } from '@/scene/runtime/world-message';

caseTest('loader.message.lengths', 'wrong-sized typed arrays are rejected', () => {
  const data = realData();

  const rejected = (patch: Record<string, unknown>): boolean => {
    return parseWorldMessage({ type: 'done', data: { ...data, ...patch } }) === null;
  };

  expect(rejected({ heights: new Int16Array(data.heights.length - 1) })).toBe(true);
  expect(rejected({ stationTops: new Float32Array(26) })).toBe(true);
  expect(rejected({ pixelTexture: new Uint8Array(1023) })).toBe(true);
  expect(rejected({ minimap: new Uint8ClampedArray(128 * 128 * 4 + 1) })).toBe(true);
  expect(rejected({})).toBe(false);
});
