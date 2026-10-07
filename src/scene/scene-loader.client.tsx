'use client';

import type { ComponentType } from 'react';

import type { WorldData, WorldRequest } from '@/scene/world/world.types';

export type WorldStageProps = Readonly<{
  generation: Promise<WorldData>;
  labels: readonly string[];
  navTemplate: string;
}>;

export const GENERATED_MARK = 'world:generated';

export const WORKER_FAILED = 'worker-failed';

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

    const parser = import('@/scene/runtime/world-message');

    worker.onmessage = (event: MessageEvent<unknown>): void => {
      const raw: unknown = event.data;

      parser.then(({ parseWorldMessage }) => {
        const message = parseWorldMessage(raw);

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
      }, fail);
    };

    worker.postMessage(request);
  });
};
