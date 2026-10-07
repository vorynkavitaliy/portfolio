import {
  STATION_BASE_MAX,
  STATION_BASE_MIN,
  STATION_COUNT,
  STATION_POSITIONS,
} from '@/scene/world/world.constants';
import { rawHeight } from '@/scene/world/heightmap-math';

export type NearestStation = Readonly<{ index: number; distance: number }>;

export const nearestStation = (x: number, z: number): NearestStation => {
  let index = -1;
  let distance = 1e9;

  for (let i = 0; i < STATION_POSITIONS.length; i++) {
    const position = STATION_POSITIONS[i];
    const dx = x - (position?.[0] ?? 0);
    const dz = z - (position?.[1] ?? 0);
    const candidate = Math.sqrt(dx * dx + dz * dz);

    if (candidate < distance) {
      index = i;
      distance = candidate;
    }
  }

  return { index, distance };
};

export const computeStationBases = (): readonly number[] => {
  const bases: number[] = [];

  for (let i = 0; i < STATION_COUNT; i++) {
    const position = STATION_POSITIONS[i];
    const raw = rawHeight(position?.[0] ?? 0, position?.[1] ?? 0);

    bases.push(Math.min(STATION_BASE_MAX, Math.max(STATION_BASE_MIN, Math.round(raw))));
  }

  return bases;
};

export const computeStationTops = (bases: readonly number[]): Float32Array => {
  const tops = new Float32Array(STATION_COUNT * 3);

  for (let i = 0; i < STATION_COUNT; i++) {
    const position = STATION_POSITIONS[i];

    tops[i * 3] = (position?.[0] ?? 0) + 0.5;
    tops[i * 3 + 1] = (bases[i] ?? 0) + 1;
    tops[i * 3 + 2] = (position?.[1] ?? 0) + 0.5;
  }

  return tops;
};
