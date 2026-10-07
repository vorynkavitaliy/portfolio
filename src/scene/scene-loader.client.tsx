'use client';

import * as z from 'zod/mini';

import type { ComponentType } from 'react';

import type { WorldData, WorldMessage, WorldRequest } from '@/scene/world/world.types';

export type WorldStageProps = Readonly<{
  generation: Promise<WorldData>;
  labels: readonly string[];
  navTemplate: string;
}>;

export const GENERATED_MARK = 'world:generated';

export const WORKER_FAILED = 'worker-failed';

const chunkSchema = z.object({
  positions: z.instanceof(Float32Array),
  normals: z.instanceof(Int8Array),
  uvs: z.instanceof(Uint8Array),
  colors: z.instanceof(Uint8Array),
  indices: z.instanceof(Uint16Array),
});

const worldDataSchema = z.object({
  heights: z.instanceof(Int16Array),
  stationTops: z.instanceof(Float32Array),
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
  pixelTexture: z.instanceof(Uint8Array),
  minimap: z.instanceof(Uint8ClampedArray),
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

export const loadWorldStage = async (): Promise<ComponentType<WorldStageProps>> => {
  const stage = await import('@/scene/stage/world-stage.client');

  return stage.WorldStage;
};

const markGenerated = (ms: number): void => {
  if (typeof performance.mark === 'function') {
    performance.mark(GENERATED_MARK, { detail: { ms } });
  }
};

export const startWorldGeneration = (
  request: WorldRequest,
  onProgress: (value: number) => void,
): Promise<WorldData> => {
  return new Promise<WorldData>((resolve, reject) => {
    let worker: Worker;

    try {
      worker = new Worker(new URL('./world/world.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      reject(new Error(WORKER_FAILED));

      return;
    }

    const fail = (): void => {
      worker.terminate();
      reject(new Error(WORKER_FAILED));
    };

    worker.onerror = fail;
    worker.onmessageerror = fail;

    worker.onmessage = (event: MessageEvent<unknown>): void => {
      const message = parseWorldMessage(event.data);

      if (message === null || message.type === 'error') {
        fail();

        return;
      }

      if (message.type === 'progress') {
        onProgress(message.value);

        return;
      }

      worker.terminate();
      markGenerated(message.data.generationMs);
      resolve(message.data);
    };

    worker.postMessage(request);
  });
};
