import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';

import { fireflyCountFor, fireflyTimeFor } from '@/scene/visuals/environment/environment-math';
import { FIREFLY_FRAGMENT, FIREFLY_VERTEX } from '@/scene/visuals/environment/environment.glsl';

import type { FrameContext, Profile, SceneModule } from '@/scene/runtime/runtime.types';
import type { WorldData } from '@/scene/world/world.types';

export const createFirefliesModule = (
  fireflies: WorldData['fireflies'],
  profile: Profile,
): SceneModule => {
  const geometry = new BufferGeometry();

  geometry.setAttribute('position', new BufferAttribute(fireflies.positions, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(fireflies.seeds, 1));
  geometry.setDrawRange(0, fireflyCountFor(profile, fireflies.seeds.length));

  const uTime = { value: 0 };
  const uScale = { value: 1 };

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime, uScale },
    vertexShader: FIREFLY_VERTEX,
    fragmentShader: FIREFLY_FRAGMENT,
  });

  const points = new Points(geometry, material);

  points.name = 'fireflies';
  points.frustumCulled = false;
  points.matrixAutoUpdate = false;
  points.updateMatrix();

  const update = (frame: FrameContext): void => {
    uTime.value = fireflyTimeFor(frame.time, frame.reducedMotion);
    uScale.value = frame.viewport.height;
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
  };

  return { object: points, update, dispose };
};
