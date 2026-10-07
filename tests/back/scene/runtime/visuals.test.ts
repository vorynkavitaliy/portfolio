import {
  Mesh,
  NearestFilter,
  NearestMipmapNearestFilter,
  SRGBColorSpace,
  type Object3D,
} from 'three';
import { expect } from 'vitest';

import { caseTest } from '@tests/back/scene/runtime/runtime.case-test';
import { realData } from '@tests/back/scene/world/world.fixture';
import { contextAttributesFor } from '@/scene/runtime/renderer';
import { failReasonOf, WorldStartError } from '@/scene/runtime/world-start-error';
import { parseWorldMessage } from '@/scene/scene-loader.client';
import { createPixelTexture, flipRows } from '@/scene/visuals/pixel-texture';
import { createTerrainModule } from '@/scene/visuals/terrain';

import type { TerrainChunk } from '@/scene/world/world.types';

const SIZE = 16;

const meshesOf = (object: Object3D): Mesh[] => {
  return object.children.filter((child): child is Mesh => {
    return child instanceof Mesh;
  });
};

const rowPixels = (): Uint8Array => {
  const pixels = new Uint8Array(SIZE * SIZE * 4);

  for (let row = 0; row < SIZE; row += 1) {
    pixels.fill(row, row * SIZE * 4, (row + 1) * SIZE * 4);
  }

  return pixels;
};

const quad = (): TerrainChunk => {
  return {
    positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1]),
    normals: new Int8Array([0, 127, 0, 0, 127, 0, 0, 127, 0, 0, 127, 0]),
    uvs: new Uint8Array([0, 0, 255, 0, 255, 255, 0, 255]),
    colors: new Uint8Array(12).fill(200),
    indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
  };
};

const empty = (): TerrainChunk => {
  return {
    positions: new Float32Array(0),
    normals: new Int8Array(0),
    uvs: new Uint8Array(0),
    colors: new Uint8Array(0),
    indices: new Uint16Array(0),
  };
};

caseTest('loader.message.progress', 'progress message', () => {
  expect(parseWorldMessage({ type: 'progress', value: 0.4 })).toEqual({
    type: 'progress',
    value: 0.4,
  });
});

caseTest('loader.message.done', 'generated world', () => {
  const data = realData();
  const parsed = parseWorldMessage({ type: 'done', data });

  expect(parsed?.type).toBe('done');

  if (parsed?.type !== 'done') {
    return;
  }

  expect(parsed.data.heights).toBe(data.heights);
  expect(parsed.data.chunks[0]?.positions).toBe(data.chunks[0]?.positions);
  expect(parsed.data.minimap).toBe(data.minimap);
  expect(parsed.data.letters.targets).toBe(data.letters.targets);
});

caseTest('loader.message.rejects', 'malformed messages', () => {
  const data = realData();

  expect(
    parseWorldMessage({ type: 'done', data: { ...data, heights: new Float32Array(4) } }),
  ).toBeNull();

  expect(parseWorldMessage({ type: 'done', data: { ...data, minimap: undefined } })).toBeNull();
  expect(parseWorldMessage({ type: 'progress', value: '0.4' })).toBeNull();
  expect(parseWorldMessage({ type: 'boom' })).toBeNull();
  expect(parseWorldMessage(null)).toBeNull();
});

caseTest('loader.message.error', 'error message', () => {
  expect(parseWorldMessage({ type: 'error' })).toEqual({ type: 'error' });
});

caseTest('pixel.flip', 'canvas row order', () => {
  const flipped = flipRows(rowPixels(), SIZE);

  expect(flipped[0]).toBe(15);
  expect(flipped[(SIZE - 1) * SIZE * 4]).toBe(0);
  expect(flipped[7 * SIZE * 4]).toBe(8);
});

caseTest('pixel.filters', 'nearest sampling in sRGB', () => {
  const texture = createPixelTexture(rowPixels());

  expect(texture.magFilter).toBe(NearestFilter);
  expect(texture.minFilter).toBe(NearestMipmapNearestFilter);
  expect(texture.generateMipmaps).toBe(true);
  expect(texture.colorSpace).toBe(SRGBColorSpace);
  expect(texture.image.width).toBe(SIZE);
  expect(texture.image.height).toBe(SIZE);
  texture.dispose();
});

caseTest('terrain.chunks', 'one mesh per non-empty chunk', () => {
  const texture = createPixelTexture(rowPixels());
  const terrain = createTerrainModule([quad(), empty(), quad()], texture);
  const meshes = meshesOf(terrain.object);

  expect(meshes).toHaveLength(2);

  const [first, second] = meshes;

  expect(first?.material).toBe(second?.material);

  const material = first?.material;

  expect(material).toMatchObject({ type: 'MeshLambertMaterial', vertexColors: true, map: texture });
  expect(first?.geometry.getAttribute('normal').normalized).toBe(true);
  expect(first?.geometry.getAttribute('uv').normalized).toBe(true);
  expect(first?.geometry.getAttribute('color').normalized).toBe(true);
  expect(first?.geometry.getIndex()?.count).toBe(6);
  expect(terrain.update).toBeNull();
  terrain.dispose();
  texture.dispose();
});

caseTest('terrain.dispose', 'geometries and material released', () => {
  const texture = createPixelTexture(rowPixels());
  const terrain = createTerrainModule([quad(), quad()], texture);
  const disposed: string[] = [];
  const meshes = meshesOf(terrain.object);

  for (const mesh of meshes) {
    mesh.geometry.addEventListener('dispose', () => {
      disposed.push('geometry');
    });
  }

  meshes[0]?.material.addEventListener('dispose', () => {
    disposed.push('material');
  });

  terrain.dispose();
  expect(disposed.sort()).toEqual(['geometry', 'geometry', 'material']);
  texture.dispose();
});

caseTest('start-error.reason', 'failure reasons', () => {
  expect(failReasonOf(new WorldStartError('no-webgl2'))).toBe('no-webgl2');
  expect(failReasonOf(new WorldStartError('context-lost'))).toBe('context-lost');
  expect(failReasonOf(new Error('boom'))).toBe('renderer-failed');
});

caseTest('renderer.attributes', 'context attributes by profile', () => {
  expect(contextAttributesFor('desktop')).toMatchObject({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
  });

  expect(contextAttributesFor('narrow').antialias).toBe(false);
});
