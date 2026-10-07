import type { BloomPass, SceneBuildInput, SceneModule } from '@/scene/runtime/runtime.types';

export type Actors = Readonly<{
  modules: readonly SceneModule[];
  createBloom: (() => BloomPass) | null;
}>;

export const createActors = (_input: SceneBuildInput): Actors => {
  return { modules: [], createBloom: null };
};
