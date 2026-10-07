import { createBeamsModule } from '@/scene/visuals/actors/beams';
import { createBloomPass } from '@/scene/visuals/actors/bloom';
import { createBurstModule } from '@/scene/visuals/actors/burst';
import { createLandmarksModule } from '@/scene/visuals/actors/landmarks';
import { createLettersModule } from '@/scene/visuals/actors/letters';
import { createLinkModule } from '@/scene/visuals/actors/link';
import { createPlaneModule } from '@/scene/visuals/actors/plane';
import { createRingModule } from '@/scene/visuals/actors/ring';

import type { BloomPass, SceneBuildInput, SceneModule } from '@/scene/runtime/runtime.types';

export type Actors = Readonly<{
  modules: readonly SceneModule[];
  createBloom: (() => BloomPass) | null;
}>;

export const createActors = (input: SceneBuildInput): Actors => {
  const { data, profile, renderer, scene, camera } = input;

  const modules: readonly SceneModule[] = [
    createLettersModule(data),
    createPlaneModule(),
    createBeamsModule(data.stationTops),
    createLinkModule(),
    createLandmarksModule(data),
    createRingModule(),
    createBurstModule(data.burst),
  ];

  if (profile !== 'desktop') {
    return { modules, createBloom: null };
  }

  return {
    modules,
    createBloom: (): BloomPass => {
      return createBloomPass(renderer, scene, camera);
    },
  };
};
