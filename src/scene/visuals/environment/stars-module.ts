import { BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three';

import { colorOf } from '@/scene/visuals/environment/color-of';
import {
  ENVIRONMENT_COLORS,
  STAR_OPACITY,
  STAR_SIZE,
} from '@/scene/visuals/environment/environment.constants';

import type { SceneModule } from '@/scene/runtime/runtime.types';

export const createStarsModule = (stars: Float32Array): SceneModule => {
  const geometry = new BufferGeometry();

  geometry.setAttribute('position', new BufferAttribute(stars, 3));

  const material = new PointsMaterial({
    size: STAR_SIZE,
    sizeAttenuation: false,
    color: colorOf(ENVIRONMENT_COLORS.star),
    fog: false,
    transparent: true,
    opacity: STAR_OPACITY,
  });

  const points = new Points(geometry, material);

  points.name = 'stars';
  points.frustumCulled = false;
  points.matrixAutoUpdate = false;
  points.updateMatrix();

  const dispose = (): void => {
    geometry.dispose();
    material.dispose();
  };

  return { object: points, update: null, dispose };
};
