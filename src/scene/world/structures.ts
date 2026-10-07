import { GLOW_COLORS, PALETTE } from '@/scene/world/palette';
import { setCell, type MaterialTable, type Occupancy } from '@/scene/world/occupancy';
import {
  AI_NODE_DZ,
  AI_NODE_OFFSETS_X,
  AI_NODE_UP,
  MAP_HALF,
  MAST_OFFSET,
  STATION_COUNT,
  STATION_INDEX,
  STATION_POSITIONS,
} from '@/scene/world/world.constants';

import type { GlowCollector } from '@/scene/world/glow';

const POST_OFFSETS: readonly (readonly [number, number])[] = [
  [-3, -3],
  [3, -3],
  [-3, 3],
  [3, 3],
];

const PILLAR_OFFSETS: readonly (readonly [number, number])[] = [
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
];

const SCULPTURE_BLOCKS: readonly (readonly [number, number, number])[] = [
  [0, 5, 0],
  [1, 5, 0],
  [0, 6, 0],
  [0, 5, 1],
  [-1, 7, -1],
  [1, 7, 1],
  [-1, 6, 1],
];

const SCULPTURE_GLOWS: readonly (readonly [number, number, number])[] = [
  [2, 5, 0],
  [0, 8, 0],
  [0, 5, 2],
  [-2, 7, -1],
  [2, 7, 2],
  [-1, 4, 0],
];

const POST_HEIGHT = 3;
const PILLAR_HEIGHT = 7;
const ANTENNA_HEIGHT = 16;
const ANTENNA_BAND = 4;
const ANTENNA_BAND_AT = 3;

export const placeStructures = (
  occupancy: Occupancy,
  materials: MaterialTable,
  bases: readonly number[],
  glow: GlowCollector,
): void => {
  const plateId = materials.register(PALETTE.plate, PALETTE.plateSide);
  const stoneId = materials.register(PALETTE.stone, PALETTE.stoneDark);
  const mastId = materials.register(PALETTE.stoneDark, PALETTE.stoneDark);
  const bandId = materials.register(PALETTE.plate, PALETTE.plate);

  const put = (x: number, y: number, z: number, id: number): void => {
    setCell(occupancy, x + MAP_HALF, y, z + MAP_HALF, id);
  };

  for (let i = 0; i < STATION_COUNT; i++) {
    const position = STATION_POSITIONS[i];
    const cx = position?.[0] ?? 0;
    const cz = position?.[1] ?? 0;
    const y0 = (bases[i] ?? 0) + 1;

    for (const [dx, dz] of POST_OFFSETS) {
      for (let y = 0; y < POST_HEIGHT; y++) {
        put(cx + dx, y0 + y, cz + dz, plateId);
      }

      glow.add(cx + dx, y0 + POST_HEIGHT, cz + dz, GLOW_COLORS.post, 0.55);
    }

    glow.add(cx, y0, cz, GLOW_COLORS.centre, 1);

    if (i === STATION_INDEX.systems) {
      for (const [dx, dz] of PILLAR_OFFSETS) {
        for (let y = 0; y < PILLAR_HEIGHT; y++) {
          put(cx + dx, y0 + y, cz + dz, stoneId);
        }

        glow.add(cx + dx, y0 + PILLAR_HEIGHT, cz + dz, GLOW_COLORS.pillar, 0.6);
      }
    }

    if (i === STATION_INDEX.thisWorld) {
      for (const [dx, dy, dz] of SCULPTURE_BLOCKS) {
        put(cx + dx, y0 + dy, cz + dz, plateId);
      }

      for (const [dx, dy, dz] of SCULPTURE_GLOWS) {
        glow.add(cx + dx, y0 + dy, cz + dz, GLOW_COLORS.sculpture, 0.6);
      }
    }

    if (i === STATION_INDEX.contact) {
      for (let y = 0; y < ANTENNA_HEIGHT; y++) {
        const banded = y % ANTENNA_BAND === ANTENNA_BAND_AT;

        put(cx + 2, y0 + y, cz - 2, banded ? bandId : mastId);
      }
    }
  }
};

export const computeAiNodes = (stationTops: Float32Array): Float32Array => {
  const baseOffset = STATION_INDEX.aiEngineering * 3;
  const baseX = stationTops[baseOffset] ?? 0;
  const baseY = stationTops[baseOffset + 1] ?? 0;
  const baseZ = stationTops[baseOffset + 2] ?? 0;
  const nodes = new Float32Array(AI_NODE_OFFSETS_X.length * 3);

  AI_NODE_OFFSETS_X.forEach((dx, index) => {
    nodes[index * 3] = baseX + dx;
    nodes[index * 3 + 1] = baseY + AI_NODE_UP;
    nodes[index * 3 + 2] = baseZ + AI_NODE_DZ;
  });

  return nodes;
};

export const placeAiPillars = (
  occupancy: Occupancy,
  materials: MaterialTable,
  aiNodes: Float32Array,
  stationTops: Float32Array,
): void => {
  const stoneId = materials.register(PALETTE.stone, PALETTE.stoneDark);
  const baseY = stationTops[STATION_INDEX.aiEngineering * 3 + 1] ?? 0;

  for (let node = 0; node < aiNodes.length; node += 3) {
    const nodeX = aiNodes[node] ?? 0;
    const nodeY = aiNodes[node + 1] ?? 0;
    const nodeZ = aiNodes[node + 2] ?? 0;

    for (let y = baseY; y < nodeY - 0.5; y++) {
      setCell(occupancy, Math.floor(nodeX) + MAP_HALF, y, Math.floor(nodeZ) + MAP_HALF, stoneId);
    }
  }
};

export const computeMast = (bases: readonly number[]): Float32Array => {
  const position = STATION_POSITIONS[STATION_INDEX.contact];
  const base = bases[STATION_INDEX.contact] ?? 0;

  return Float32Array.of(
    (position?.[0] ?? 0) + MAST_OFFSET[0],
    base + MAST_OFFSET[1],
    (position?.[1] ?? 0) + MAST_OFFSET[2],
  );
};
