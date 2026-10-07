import { BoxGeometry, InstancedMesh, Matrix4, MeshLambertMaterial } from 'three';

import { cloudOffsetX } from '@/scene/visuals/environment/environment-math';
import {
  CLOUD_OPACITY,
  CLOUD_SIZE,
  ENVIRONMENT_COLORS,
} from '@/scene/visuals/environment/environment.constants';
import { colorOf } from '@/scene/visuals/environment/color-of';

import type { FrameContext, SceneModule } from '@/scene/runtime/runtime.types';

export const createCloudsModule = (clouds: Float32Array): SceneModule => {
  const count = Math.floor(clouds.length / 3);
  const geometry = new BoxGeometry(CLOUD_SIZE.x, CLOUD_SIZE.y, CLOUD_SIZE.z);

  const material = new MeshLambertMaterial({
    color: colorOf(ENVIRONMENT_COLORS.cloud),
    transparent: true,
    opacity: CLOUD_OPACITY,
    emissive: colorOf(ENVIRONMENT_COLORS.cloudEmissive),
  });

  const mesh = new InstancedMesh(geometry, material, count);
  const matrix = new Matrix4();

  mesh.name = 'clouds';

  for (let i = 0; i < count; i += 1) {
    matrix.makeTranslation(clouds[i * 3] ?? 0, clouds[i * 3 + 1] ?? 0, clouds[i * 3 + 2] ?? 0);
    mesh.setMatrixAt(i, matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.position.x = cloudOffsetX(0);

  const update = (frame: FrameContext): void => {
    mesh.position.x = cloudOffsetX(frame.time);
  };

  const dispose = (): void => {
    mesh.dispose();
    geometry.dispose();
    material.dispose();
  };

  return { object: mesh, update, dispose };
};
