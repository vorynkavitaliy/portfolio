import { BufferAttribute, BufferGeometry } from 'three';

import type { Rgb } from '@/scene/world/palette';

export type Triple = readonly [number, number, number];

export type BoxPart = Readonly<{ size: Triple; at: Triple; color: Rgb }>;

type Face = Readonly<{ normal: Triple; u: Triple; v: Triple }>;

const FACES: readonly Face[] = [
  { normal: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  { normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { normal: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0] },
  { normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { normal: [0, 0, -1], u: [0, 1, 0], v: [1, 0, 0] },
];

const CORNERS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

export const VERTICES_PER_BOX = 24;
export const INDICES_PER_BOX = 36;

const component = (triple: Triple, axis: number): number => {
  return triple[axis] ?? 0;
};

export const mergeBoxes = (parts: readonly BoxPart[]): BufferGeometry => {
  const positions = new Float32Array(parts.length * VERTICES_PER_BOX * 3);
  const normals = new Float32Array(parts.length * VERTICES_PER_BOX * 3);
  const colors = new Float32Array(parts.length * VERTICES_PER_BOX * 3);
  const indices = new Uint16Array(parts.length * INDICES_PER_BOX);

  parts.forEach((part, partIndex) => {
    FACES.forEach((face, faceIndex) => {
      const firstVertex = partIndex * VERTICES_PER_BOX + faceIndex * 4;
      const firstIndex = partIndex * INDICES_PER_BOX + faceIndex * 6;

      CORNERS.forEach(([su, sv], cornerIndex) => {
        const offset = (firstVertex + cornerIndex) * 3;

        for (let axis = 0; axis < 3; axis += 1) {
          const along =
            component(face.normal, axis) +
            su * component(face.u, axis) +
            sv * component(face.v, axis);

          positions[offset + axis] =
            along * (component(part.size, axis) / 2) + component(part.at, axis);

          normals[offset + axis] = component(face.normal, axis);
          colors[offset + axis] = part.color[axis] ?? 0;
        }
      });

      indices.set(
        [
          firstVertex,
          firstVertex + 1,
          firstVertex + 2,
          firstVertex,
          firstVertex + 2,
          firstVertex + 3,
        ],
        firstIndex,
      );
    });
  });

  const geometry = new BufferGeometry();

  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new BufferAttribute(normals, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();

  return geometry;
};
