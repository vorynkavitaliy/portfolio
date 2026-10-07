import { cellIndex, type MaterialTable, type Occupancy } from '@/scene/world/occupancy';
import {
  CHUNK_SIZE,
  CHUNKS_PER_SIDE,
  FACE_SHADE,
  MAP_HALF,
  MAP_SIZE,
  WORLD_HEIGHT,
} from '@/scene/world/world.constants';

import type { TerrainChunk } from '@/scene/world/world.types';

const MAX_VERTICES = 65536;
const FACES_PER_CHUNK_MAX = MAX_VERTICES / 4;
const NORMAL_UNIT = 127;
const UV_MAX = 255;

type FaceTemplate = Readonly<{
  neighbour: readonly [number, number, number];
  normal: readonly [number, number, number];
  corners: readonly (readonly [number, number, number])[];
  shadeClass: number;
  useTopColor: boolean;
}>;

const SHADES = [FACE_SHADE.top, FACE_SHADE.bottom, FACE_SHADE.x, FACE_SHADE.z] as const;

const FACES: readonly FaceTemplate[] = [
  {
    neighbour: [0, 1, 0],
    normal: [0, 1, 0],
    corners: [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
    ],
    shadeClass: 0,
    useTopColor: true,
  },
  {
    neighbour: [0, -1, 0],
    normal: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    shadeClass: 1,
    useTopColor: false,
  },
  {
    neighbour: [1, 0, 0],
    normal: [1, 0, 0],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
    shadeClass: 2,
    useTopColor: false,
  },
  {
    neighbour: [-1, 0, 0],
    normal: [-1, 0, 0],
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    shadeClass: 2,
    useTopColor: false,
  },
  {
    neighbour: [0, 0, 1],
    normal: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    shadeClass: 3,
    useTopColor: false,
  },
  {
    neighbour: [0, 0, -1],
    normal: [0, 0, -1],
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
    shadeClass: 3,
    useTopColor: false,
  },
];

const UV_CORNERS: readonly (readonly [number, number])[] = [
  [0, 0],
  [UV_MAX, 0],
  [UV_MAX, UV_MAX],
  [0, UV_MAX],
];

const toByte = (value: number): number => {
  return Math.round(Math.min(1, Math.max(0, value)) * UV_MAX);
};

const buildFaceColors = (materials: MaterialTable): Uint8Array => {
  const table = new Uint8Array((materials.entries.length + 1) * FACES.length * 3);

  materials.entries.forEach((entry, entryIndex) => {
    FACES.forEach((face, faceIndex) => {
      const source = face.useTopColor ? entry.top : entry.side;
      const shade = SHADES[face.shadeClass] ?? 1;
      const offset = ((entryIndex + 1) * FACES.length + faceIndex) * 3;

      table[offset] = toByte(source[0] * shade);
      table[offset + 1] = toByte(source[1] * shade);
      table[offset + 2] = toByte(source[2] * shade);
    });
  });

  return table;
};

const isSolid = (cells: Uint8Array, ix: number, y: number, iz: number): boolean => {
  if (y < 1) {
    return true;
  }

  if (y >= WORLD_HEIGHT || ix < 0 || ix >= MAP_SIZE || iz < 0 || iz >= MAP_SIZE) {
    return false;
  }

  return (cells[cellIndex(ix, y, iz)] ?? 0) !== 0;
};

export const meshOccupancy = (
  occupancy: Occupancy,
  materials: MaterialTable,
  onChunk: (done: number, total: number) => void,
): readonly TerrainChunk[] => {
  const { cells } = occupancy;
  const faceColors = buildFaceColors(materials);
  const scratchPositions = new Float32Array(MAX_VERTICES * 3);
  const scratchNormals = new Int8Array(MAX_VERTICES * 3);
  const scratchUvs = new Uint8Array(MAX_VERTICES * 2);
  const scratchColors = new Uint8Array(MAX_VERTICES * 3);
  const scratchIndices = new Uint16Array(FACES_PER_CHUNK_MAX * 6);
  const chunks: TerrainChunk[] = [];
  const total = CHUNKS_PER_SIDE * CHUNKS_PER_SIDE;
  let done = 0;

  for (let chunkX = 0; chunkX < CHUNKS_PER_SIDE; chunkX++) {
    for (let chunkZ = 0; chunkZ < CHUNKS_PER_SIDE; chunkZ++) {
      let faces = 0;

      for (let ix = chunkX * CHUNK_SIZE; ix < (chunkX + 1) * CHUNK_SIZE; ix++) {
        for (let iz = chunkZ * CHUNK_SIZE; iz < (chunkZ + 1) * CHUNK_SIZE; iz++) {
          const columnTop = occupancy.tops[ix * MAP_SIZE + iz] ?? 0;

          for (let y = 1; y <= columnTop; y++) {
            const material = cells[cellIndex(ix, y, iz)] ?? 0;

            if (material === 0) {
              continue;
            }

            for (let faceIndex = 0; faceIndex < FACES.length; faceIndex++) {
              const face = FACES[faceIndex];

              if (face === undefined) {
                continue;
              }

              const [nx, ny, nz] = face.neighbour;

              if (isSolid(cells, ix + nx, y + ny, iz + nz)) {
                continue;
              }

              if (faces >= FACES_PER_CHUNK_MAX) {
                throw new Error('chunk exceeds 16-bit index range');
              }

              const vertexBase = faces * 4;
              const colorOffset = (material * FACES.length + faceIndex) * 3;

              for (let corner = 0; corner < 4; corner++) {
                const offsets = face.corners[corner] ?? [0, 0, 0];
                const vertex = vertexBase + corner;
                const uv = UV_CORNERS[corner] ?? [0, 0];

                scratchPositions[vertex * 3] = ix - MAP_HALF + (offsets[0] ?? 0);
                scratchPositions[vertex * 3 + 1] = y - 1 + (offsets[1] ?? 0);
                scratchPositions[vertex * 3 + 2] = iz - MAP_HALF + (offsets[2] ?? 0);
                scratchNormals[vertex * 3] = face.normal[0] * NORMAL_UNIT;
                scratchNormals[vertex * 3 + 1] = face.normal[1] * NORMAL_UNIT;
                scratchNormals[vertex * 3 + 2] = face.normal[2] * NORMAL_UNIT;
                scratchUvs[vertex * 2] = uv[0] ?? 0;
                scratchUvs[vertex * 2 + 1] = uv[1] ?? 0;
                scratchColors[vertex * 3] = faceColors[colorOffset] ?? 0;
                scratchColors[vertex * 3 + 1] = faceColors[colorOffset + 1] ?? 0;
                scratchColors[vertex * 3 + 2] = faceColors[colorOffset + 2] ?? 0;
              }

              const indexBase = faces * 6;

              scratchIndices[indexBase] = vertexBase;
              scratchIndices[indexBase + 1] = vertexBase + 1;
              scratchIndices[indexBase + 2] = vertexBase + 2;
              scratchIndices[indexBase + 3] = vertexBase;
              scratchIndices[indexBase + 4] = vertexBase + 2;
              scratchIndices[indexBase + 5] = vertexBase + 3;
              faces++;
            }
          }
        }
      }

      if (faces > 0) {
        chunks.push({
          positions: scratchPositions.slice(0, faces * 12),
          normals: scratchNormals.slice(0, faces * 12),
          uvs: scratchUvs.slice(0, faces * 8),
          colors: scratchColors.slice(0, faces * 12),
          indices: scratchIndices.slice(0, faces * 6),
        });
      }

      done++;
      onChunk(done, total);
    }
  }

  return chunks;
};
