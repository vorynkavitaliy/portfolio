import { BoxGeometry, Color, InstancedMesh, Matrix4, MeshBasicMaterial } from 'three';

import { colorOf } from '@/scene/visuals/environment/color-of';
import { ENVIRONMENT_COLORS } from '@/scene/visuals/environment/environment.constants';

import type { SceneModule } from '@/scene/runtime/runtime.types';
import type { WorldData } from '@/scene/world/world.types';

export const createGlowModule = (glow: WorldData['glow']): SceneModule => {
  const count = glow.scales.length;
  const geometry = new BoxGeometry(1, 1, 1);

  const material = new MeshBasicMaterial({
    color: colorOf(ENVIRONMENT_COLORS.glowBase),
    toneMapped: false,
  });

  const mesh = new InstancedMesh(geometry, material, count);
  const matrix = new Matrix4();
  const color = new Color();

  mesh.name = 'glow';

  for (let i = 0; i < count; i += 1) {
    const scale = glow.scales[i] ?? 1;

    matrix
      .makeScale(scale, scale, scale)
      .setPosition(
        glow.positions[i * 3] ?? 0,
        glow.positions[i * 3 + 1] ?? 0,
        glow.positions[i * 3 + 2] ?? 0,
      );

    mesh.setMatrixAt(i, matrix);

    mesh.setColorAt(
      i,
      color.setRGB(
        glow.colors[i * 3] ?? 0,
        glow.colors[i * 3 + 1] ?? 0,
        glow.colors[i * 3 + 2] ?? 0,
      ),
    );
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();

  const dispose = (): void => {
    mesh.dispose();
    geometry.dispose();
    material.dispose();
  };

  return { object: mesh, update: null, dispose };
};
