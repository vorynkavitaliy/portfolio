import { expect, test, vi } from 'vitest';

import { caseTest } from '@tests/back/scene/runtime/runtime.case-test';
import { buildSceneModules, yieldToMain } from '@/scene/runtime/world-runtime';

import type { SceneBuildInput, SceneModule } from '@/scene/runtime/runtime.types';

const mocks = vi.hoisted(() => {
  return { log: [] as string[] };
});

const moduleNamed = (name: string): SceneModule => {
  return { name } as unknown as SceneModule;
};

vi.mock('@/scene/visuals/terrain', () => {
  return {
    createTerrainModule: () => {
      mocks.log.push('terrain');

      return moduleNamed('terrain');
    },
  };
});

vi.mock('@/scene/visuals/environment/environment', () => {
  return {
    createEnvironment: () => {
      mocks.log.push('environment');

      return [moduleNamed('sky'), moduleNamed('moon')];
    },
  };
});

vi.mock('@/scene/visuals/actors/actors', () => {
  return {
    createActors: () => {
      mocks.log.push('actors');

      return { modules: [moduleNamed('plane')], createBloom: null };
    },
  };
});

const input = { data: { chunks: [] } } as unknown as SceneBuildInput;

const namesOf = (modules: readonly SceneModule[]): string[] => {
  return modules.map((entry) => {
    return (entry as unknown as { name: string }).name;
  });
};

caseTest(
  'build.yields-between-modules',
  'each build step runs in its own turn, order kept',
  async () => {
    mocks.log.length = 0;

    const { modules } = await buildSceneModules(input, () => {
      mocks.log.push('yield');

      return Promise.resolve();
    });

    expect(mocks.log).toEqual(['terrain', 'yield', 'environment', 'yield', 'actors']);
    expect(namesOf(modules)).toEqual(['terrain', 'sky', 'moon', 'plane']);
  },
);

test('yieldToMain prefers scheduler.yield and falls back to a macrotask', async () => {
  const yielded = vi.fn<() => Promise<void>>(() => {
    return Promise.resolve();
  });

  vi.stubGlobal('scheduler', { yield: yielded });
  await yieldToMain();
  expect(yielded).toHaveBeenCalledTimes(1);

  vi.unstubAllGlobals();
  vi.useFakeTimers();

  let done = false;

  const pending = yieldToMain().then(() => {
    done = true;
  });

  await Promise.resolve();
  expect(done).toBe(false);
  await vi.advanceTimersByTimeAsync(0);
  await pending;
  expect(done).toBe(true);
  vi.useRealTimers();
});
