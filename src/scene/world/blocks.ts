import { PALETTE, type Rgb } from '@/scene/world/palette';
import { cellIndex, type MaterialTable, type Occupancy } from '@/scene/world/occupancy';
import { nearestStation } from '@/scene/world/stations';
import {
  DEPTH_SHADE,
  DEPTH_SHADE_MAX_DEPTH,
  MAP_HALF,
  MAP_SIZE,
  PLATE_RADIUS,
  SAND_MAX,
  SNOW_FROM,
  STONE_FROM,
  WORLD_HEIGHT,
} from '@/scene/world/world.constants';

const KIND_COUNT = 6;
const DEPTH_LEVELS = DEPTH_SHADE_MAX_DEPTH + 1;

const scale = (color: Rgb, factor: number): Rgb => {
  return [color[0] * factor, color[1] * factor, color[2] * factor];
};

const terrainKind = (y: number, depth: number, plate: boolean): number => {
  if (plate && depth === 0) {
    return 0;
  }

  if (y <= SAND_MAX) {
    return 1;
  }

  if (y >= SNOW_FROM) {
    return 2;
  }

  if (y >= STONE_FROM) {
    return 3;
  }

  return depth === 0 ? 4 : 5;
};

const kindColors = (kind: number, depth: number): readonly [Rgb, Rgb] => {
  switch (kind) {
    case 0:
      return [PALETTE.plate, PALETTE.plateSide];
    case 1:
      return [PALETTE.sand, PALETTE.sandSide];
    case 2:
      return [PALETTE.snow, depth === 0 ? PALETTE.snowSide : PALETTE.stone];
    case 3:
      return [PALETTE.stone, PALETTE.stoneDark];
    case 4:
      return [PALETTE.grass, PALETTE.dirt];
    default:
      return [PALETTE.dirt, PALETTE.dirt];
  }
};

export const fillTerrain = (
  occupancy: Occupancy,
  heights: Int16Array,
  materials: MaterialTable,
): void => {
  const cache = new Uint8Array(KIND_COUNT * DEPTH_LEVELS);

  const materialFor = (y: number, depth: number, plate: boolean): number => {
    const kind = terrainKind(y, depth, plate);
    const cappedDepth = Math.min(depth, DEPTH_SHADE_MAX_DEPTH);
    const key = kind * DEPTH_LEVELS + cappedDepth;
    const cached = cache[key] ?? 0;

    if (cached !== 0) {
      return cached;
    }

    const [top, side] = kindColors(kind, depth);
    const id = materials.register(top, scale(side, 1 - cappedDepth * DEPTH_SHADE));

    cache[key] = id;

    return id;
  };

  for (let ix = 0; ix < MAP_SIZE; ix++) {
    for (let iz = 0; iz < MAP_SIZE; iz++) {
      const top = Math.min(heights[ix * MAP_SIZE + iz] ?? 0, WORLD_HEIGHT - 1);
      const station = nearestStation(ix - MAP_HALF + 0.5, iz - MAP_HALF + 0.5);
      const plate = station.distance < PLATE_RADIUS;
      const base = cellIndex(ix, 0, iz);

      for (let y = 1; y <= top; y++) {
        occupancy.cells[base + y] = materialFor(y, top - y, plate);
      }

      occupancy.tops[ix * MAP_SIZE + iz] = Math.max(occupancy.tops[ix * MAP_SIZE + iz] ?? 0, top);
    }
  }
};
