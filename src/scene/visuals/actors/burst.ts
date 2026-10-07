import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';

import { BURST_ORIGIN_TIME } from '@/scene/visuals/actors/actors.constants';
import { burstVisible } from '@/scene/visuals/actors/actors-math';
import { BURST_FRAGMENT, BURST_VERTEX } from '@/scene/visuals/actors/burst.glsl';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';

export const createBurstModule = (directions: Float32Array): SceneModule => {
  const geometry = new BufferGeometry();
  const origin = new Vector3();

  const uniforms = {
    uT: { value: BURST_ORIGIN_TIME },
    uOrigin: { value: origin },
    uScale: { value: 1 },
  };

  geometry.setAttribute('position', new BufferAttribute(new Float32Array(directions.length), 3));
  geometry.setAttribute('aDir', new BufferAttribute(directions, 3));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms,
    vertexShader: BURST_VERTEX,
    fragmentShader: BURST_FRAGMENT,
  });

  const points = new Points(geometry, material);

  points.name = 'burst';
  points.frustumCulled = false;
  points.visible = false;

  const update = (frame: FrameContext): void => {
    const { burst } = frame.effects;

    points.visible = burstVisible(burst.t, frame.reducedMotion);

    if (!points.visible) {
      return;
    }

    uniforms.uT.value = burst.t;
    origin.set(burst.x, burst.y, burst.z);
    uniforms.uScale.value = frame.viewport.height;
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
  };

  return { object: points, update, dispose };
};
