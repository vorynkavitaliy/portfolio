import { CircleGeometry, Mesh, MeshBasicMaterial } from 'three';

import { colorOf } from '@/scene/visuals/environment/color-of';
import {
  ENVIRONMENT_COLORS,
  MOON_DISTANCE,
  MOON_RADIUS,
  MOON_SEGMENTS,
} from '@/scene/visuals/environment/environment.constants';
import { moonDirection } from '@/scene/visuals/environment/sky-module';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';

export const createMoonModule = (): SceneModule => {
  const direction = moonDirection();
  const geometry = new CircleGeometry(MOON_RADIUS, MOON_SEGMENTS);

  const material = new MeshBasicMaterial({
    color: colorOf(ENVIRONMENT_COLORS.moonDisc),
    toneMapped: false,
    fog: false,
  });

  const mesh = new Mesh(geometry, material);

  mesh.name = 'moon';
  mesh.frustumCulled = false;

  const update = (frame: FrameContext): void => {
    const camera = frame.camera.position;

    mesh.position.copy(camera).addScaledVector(direction, MOON_DISTANCE);
    mesh.lookAt(camera);
  };

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
  };

  return { object: mesh, update, dispose };
};
