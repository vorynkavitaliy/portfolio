import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  type Texture,
} from 'three';

import type { SceneModule } from '@/scene/runtime/runtime.types';
import type { TerrainChunk } from '@/scene/world/world.types';

const chunkGeometry = (chunk: TerrainChunk): BufferGeometry => {
  const geometry = new BufferGeometry();

  geometry.setAttribute('position', new BufferAttribute(chunk.positions, 3));
  geometry.setAttribute('normal', new BufferAttribute(chunk.normals, 3, true));
  geometry.setAttribute('uv', new BufferAttribute(chunk.uvs, 2, true));
  geometry.setAttribute('color', new BufferAttribute(chunk.colors, 3, true));
  geometry.setIndex(new BufferAttribute(chunk.indices, 1));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  return geometry;
};

export const createTerrainModule = (
  chunks: readonly TerrainChunk[],
  pixelTexture: Texture,
): SceneModule => {
  const material = new MeshLambertMaterial({ vertexColors: true, map: pixelTexture });
  const group = new Group();
  const geometries: BufferGeometry[] = [];

  group.name = 'terrain';

  for (const chunk of chunks) {
    if (chunk.indices.length === 0) {
      continue;
    }

    const geometry = chunkGeometry(chunk);
    const mesh = new Mesh(geometry, material);

    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    geometries.push(geometry);
    group.add(mesh);
  }

  group.matrixAutoUpdate = false;
  group.updateMatrix();

  const dispose = (): void => {
    for (const geometry of geometries) {
      geometry.dispose();
    }

    material.dispose();
    group.clear();
  };

  return { object: group, update: null, dispose };
};
