import { rawHeight, smooth } from '@/scene/world/heightmap-math';
import { nearestStation } from '@/scene/world/stations';
import {
  FLATTEN_INNER,
  FLATTEN_OUTER,
  MAP_HALF,
  MAP_SIZE,
  SEA_LEVEL,
} from '@/scene/world/world.constants';

import type { Terrain } from '@/scene/flight/flight.types';

export const createTerrain = (heights: Int16Array): Terrain => {
  const heightAt = (x: number, z: number): number => {
    const ix = Math.floor(x) + MAP_HALF;
    const iz = Math.floor(z) + MAP_HALF;

    if (ix < 0 || iz < 0 || ix >= MAP_SIZE || iz >= MAP_SIZE) {
      return 1;
    }

    return heights[ix * MAP_SIZE + iz] ?? 1;
  };

  return { heightAt, seaLevel: SEA_LEVEL, half: MAP_HALF };
};

export const generateHeights = (
  bases: readonly number[],
  onColumn: (ix: number) => void,
): Int16Array => {
  const heights = new Int16Array(MAP_SIZE * MAP_SIZE);

  for (let ix = 0; ix < MAP_SIZE; ix++) {
    for (let iz = 0; iz < MAP_SIZE; iz++) {
      const x = ix - MAP_HALF + 0.5;
      const z = iz - MAP_HALF + 0.5;
      let height = rawHeight(x, z);
      const station = nearestStation(x, z);

      if (station.distance < FLATTEN_OUTER) {
        const base = bases[station.index] ?? height;

        height = height + (base - height) * smooth(FLATTEN_OUTER, FLATTEN_INNER, station.distance);
      }

      heights[ix * MAP_SIZE + iz] = Math.max(1, Math.round(height));
    }

    onColumn(ix);
  }

  return heights;
};
