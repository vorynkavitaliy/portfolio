import * as z from 'zod/mini';

import { MAP_SIZE, PIXEL_TEXTURE_SIZE, STATION_COUNT } from '@/scene/world/world.constants';

import type { WorldMessage } from '@/scene/world/world.types';

const HEIGHTS_LENGTH = MAP_SIZE * MAP_SIZE;
const STATION_TOPS_LENGTH = STATION_COUNT * 3;
const PIXEL_TEXTURE_LENGTH = PIXEL_TEXTURE_SIZE * PIXEL_TEXTURE_SIZE * 4;
const MINIMAP_LENGTH = MAP_SIZE * MAP_SIZE * 4;

const lengthIs = (length: number): ReturnType<typeof z.refine<ArrayLike<number>>> => {
  return z.refine((array: ArrayLike<number>) => {
    return array.length === length;
  });
};

const chunkSchema = z.object({
  positions: z.instanceof(Float32Array),
  normals: z.instanceof(Int8Array),
  uvs: z.instanceof(Uint8Array),
  colors: z.instanceof(Uint8Array),
  indices: z.instanceof(Uint16Array),
});

const worldDataSchema = z.object({
  heights: z.instanceof(Int16Array).check(lengthIs(HEIGHTS_LENGTH)),
  stationTops: z.instanceof(Float32Array).check(lengthIs(STATION_TOPS_LENGTH)),
  chunks: z.array(chunkSchema),
  glow: z.object({
    positions: z.instanceof(Float32Array),
    colors: z.instanceof(Float32Array),
    scales: z.instanceof(Float32Array),
  }),
  clouds: z.instanceof(Float32Array),
  stars: z.instanceof(Float32Array),
  burst: z.instanceof(Float32Array),
  aiNodes: z.instanceof(Float32Array),
  mast: z.instanceof(Float32Array),
  fireflies: z.object({
    positions: z.instanceof(Float32Array),
    seeds: z.instanceof(Float32Array),
  }),
  letters: z.object({
    targets: z.instanceof(Float32Array),
    starts: z.instanceof(Float32Array),
    delays: z.instanceof(Float32Array),
  }),
  pixelTexture: z.instanceof(Uint8Array).check(lengthIs(PIXEL_TEXTURE_LENGTH)),
  minimap: z.instanceof(Uint8ClampedArray).check(lengthIs(MINIMAP_LENGTH)),
  generationMs: z.number(),
});

const worldMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('progress'), value: z.number() }),
  z.object({ type: z.literal('done'), data: worldDataSchema }),
  z.object({ type: z.literal('error') }),
]);

export const parseWorldMessage = (raw: unknown): WorldMessage | null => {
  const parsed = worldMessageSchema.safeParse(raw);

  return parsed.success ? parsed.data : null;
};
