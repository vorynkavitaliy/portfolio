import type { Color } from 'three';
import { BackSide, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from 'three';

import { colorOf } from '@/scene/visuals/environment/color-of';
import {
  ENVIRONMENT_COLORS,
  MOON_DIRECTION,
  SKY_RADIUS,
  SKY_SEGMENTS,
} from '@/scene/visuals/environment/environment.constants';
import { SKY_FRAGMENT, SKY_VERTEX } from '@/scene/visuals/environment/environment.glsl';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';

export const moonDirection = (): Vector3 => {
  return new Vector3(MOON_DIRECTION.x, MOON_DIRECTION.y, MOON_DIRECTION.z).normalize();
};

export const createSkyModule = (horizon: Color): SceneModule => {
  const geometry = new SphereGeometry(SKY_RADIUS, SKY_SEGMENTS.width, SKY_SEGMENTS.height);

  const material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: colorOf(ENVIRONMENT_COLORS.skyTop) },
      uHorizon: { value: horizon },
      uMoon: { value: moonDirection() },
    },
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
  });

  const mesh = new Mesh(geometry, material);

  mesh.name = 'sky';
  mesh.frustumCulled = false;

  const update = (frame: FrameContext): void => {
    mesh.position.copy(frame.camera.position);
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
  };

  return { object: mesh, update, dispose };
};
