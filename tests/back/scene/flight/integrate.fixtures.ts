import type { PlaneState, Terrain, Vec3 } from '@/scene/flight/flight.types';

export const FIXTURE_HALF = 64;
export const FIXTURE_SEA = 7;
export const OUTSIDE_HEIGHT = 1;
export const STEP_60 = 1 / 60;

const inMap = (x: number, z: number): boolean => {
  const ix = Math.floor(x) + FIXTURE_HALF;
  const iz = Math.floor(z) + FIXTURE_HALF;

  return ix >= 0 && iz >= 0 && ix < FIXTURE_HALF * 2 && iz < FIXTURE_HALF * 2;
};

const terrainOf = (inside: (x: number, z: number) => number): Terrain => {
  return {
    heightAt: (x: number, z: number): number => {
      return inMap(x, z) ? inside(x, z) : OUTSIDE_HEIGHT;
    },
    seaLevel: FIXTURE_SEA,
    half: FIXTURE_HALF,
  };
};

export const FLAT: Terrain = terrainOf(() => {
  return 10;
});

export const RIDGE: Terrain = terrainOf((x: number) => {
  return Math.abs(x) <= 8 ? 40 : 10;
});

export const WATER: Terrain = terrainOf(() => {
  return 2;
});

export const CLIFF: Terrain = terrainOf((x: number) => {
  return x >= 0 ? 40 : 10;
});

const STATION_COLUMNS: readonly (readonly [number, number])[] = [
  [-46, 40],
  [-42, 8],
  [-20, -30],
  [8, -44],
  [26, -20],
  [46, 6],
  [24, 26],
  [-2, 4],
  [44, 46],
];

export const STATIONS: readonly Vec3[] = STATION_COLUMNS.map(([x, z]) => {
  return { x: x + 0.5, y: 11, z: z + 0.5 };
});

export const stationAt = (index: number): Vec3 => {
  const station = STATIONS[index];

  if (station === undefined) {
    throw new Error(`no fixture station ${index}`);
  }

  return station;
};

export const planeAt = (
  x: number,
  y: number,
  z: number,
  extra: Partial<Omit<PlaneState, 'pos'>> = {},
): PlaneState => {
  return { pos: { x, y, z }, yaw: 0, pitch: 0, roll: 0, speed: 13, turn: 0, ...extra };
};
