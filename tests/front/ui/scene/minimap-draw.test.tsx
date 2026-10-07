import { afterEach, beforeEach, expect } from 'vitest';

import { caseTest } from '@tests/front/ui/scene/minimap-draw.case-test';
import { drawMinimap } from '@/scene/nav/minimap';

import type { MinimapFrame } from '@/scene/nav/minimap';

const SIZE = 160;

let canvas: HTMLCanvasElement;

const terrain = (size: number): Uint8ClampedArray => {
  const image = new Uint8ClampedArray(size * size * 4);

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const offset = (row * size + column) * 4;

      image[offset] = column;
      image[offset + 1] = row;
      image[offset + 2] = 0;
      image[offset + 3] = 255;
    }
  }

  return image;
};

const blank = (size: number): Uint8ClampedArray => {
  const image = new Uint8ClampedArray(size * size * 4);

  for (let index = 3; index < image.length; index += 4) {
    image[index] = 255;
  }

  return image;
};

const frameOf = (overrides: Partial<MinimapFrame>): MinimapFrame => {
  return { image: blank(SIZE), size: SIZE, stations: [], plane: null, ...overrides };
};

const pixel = (x: number, y: number): readonly number[] => {
  const context = canvas.getContext('2d');

  if (context === null) {
    throw new Error('no context');
  }

  return [...context.getImageData(x, y, 1, 1).data];
};

const isRed = (rgba: readonly number[]): boolean => {
  return (rgba[0] ?? 0) > 200 && (rgba[1] ?? 255) < 120;
};

beforeEach(() => {
  canvas = document.createElement('canvas');
  document.body.append(canvas);
});

afterEach(() => {
  canvas.remove();
});

caseTest('minimap.draw.image', 'the terrain is drawn 1:1', () => {
  drawMinimap(canvas, frameOf({ image: terrain(128), size: 128 }));
  expect(canvas.width).toBe(128);
  expect(canvas.height).toBe(128);
  expect(pixel(0, 0)).toEqual([0, 0, 0, 255]);
  expect(pixel(100, 7)).toEqual([100, 7, 0, 255]);
  expect(pixel(3, 120)).toEqual([3, 120, 0, 255]);
  drawMinimap(canvas, frameOf({}));
  drawMinimap(canvas, frameOf({ image: terrain(128), size: 128 }));
  expect(canvas.width).toBe(128);
  expect(pixel(100, 7)).toEqual([100, 7, 0, 255]);
});

caseTest('minimap.draw.stations', 'lit amber, pending white', () => {
  drawMinimap(
    canvas,
    frameOf({
      stations: [
        { x: -32, z: -32, lit: true },
        { x: 32, z: 32, lit: false },
      ],
    }),
  );

  expect(pixel(38, 38)).toEqual([255, 170, 0, 255]);
  expect(pixel(118, 118)).toEqual([255, 255, 255, 255]);
  expect(pixel(40, 40)).toEqual([0, 0, 0, 255]);
  expect(pixel(120, 120)).toEqual([0, 0, 0, 255]);
  expect(pixel(150, 150)).toEqual([0, 0, 0, 255]);
  expect(pixel(36, 36)).toEqual([0, 0, 0, 255]);
  expect(pixel(39, 39)).toEqual([0, 0, 0, 255]);

  drawMinimap(
    canvas,
    frameOf({ image: blank(320), size: 320, stations: [{ x: -32, z: -32, lit: false }] }),
  );

  expect(pixel(75, 75)).toEqual([255, 255, 255, 255]);
  expect(pixel(80, 80)).toEqual([0, 0, 0, 255]);
  expect(pixel(73, 73)).toEqual([0, 0, 0, 255]);
});

caseTest('minimap.draw.plane', 'the triangle follows the yaw', () => {
  drawMinimap(canvas, frameOf({ plane: { x: 0, z: 0, yaw: 0 } }));
  expect(isRed(pixel(80, 85))).toBe(true);
  expect(isRed(pixel(80, 74))).toBe(false);
  drawMinimap(canvas, frameOf({ plane: { x: 0, z: 0, yaw: Math.PI } }));
  expect(isRed(pixel(80, 85))).toBe(false);
  expect(isRed(pixel(80, 74))).toBe(true);
  drawMinimap(canvas, frameOf({ image: blank(320), size: 320, plane: { x: 0, z: 0, yaw: 0 } }));
  expect(isRed(pixel(160, 172))).toBe(true);
  expect(isRed(pixel(160, 150))).toBe(true);
  expect(isRed(pixel(160, 180))).toBe(false);
});

caseTest('minimap.draw.no-plane', 'no plane, no red', () => {
  const reds = (): number => {
    const context = canvas.getContext('2d');
    const data = context?.getImageData(0, 0, SIZE, SIZE).data ?? new Uint8ClampedArray();
    let count = 0;

    for (let index = 0; index < data.length; index += 4) {
      if (isRed([data[index] ?? 0, data[index + 1] ?? 0])) {
        count += 1;
      }
    }

    return count;
  };

  drawMinimap(canvas, frameOf({ plane: null }));
  expect(reds()).toBe(0);
  drawMinimap(canvas, frameOf({ plane: { x: Number.NaN, z: 0, yaw: 0 } }));
  expect(reds()).toBe(0);
  drawMinimap(canvas, frameOf({ plane: { x: 0, z: Number.POSITIVE_INFINITY, yaw: 0 } }));
  expect(reds()).toBe(0);
  drawMinimap(canvas, frameOf({ plane: { x: 0, z: 0, yaw: Number.NaN } }));
  expect(reds()).toBe(0);
  drawMinimap(canvas, frameOf({ plane: { x: 0, z: 0, yaw: 0 } }));
  expect(reds()).toBeGreaterThan(20);
});
