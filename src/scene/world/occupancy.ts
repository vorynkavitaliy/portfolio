import { MAP_SIZE, WORLD_HEIGHT } from '@/scene/world/world.constants';
import type { Rgb } from '@/scene/world/palette';

export const MAX_MATERIALS = 255;

export type Occupancy = Readonly<{ cells: Uint8Array; tops: Uint8Array }>;

export const createOccupancy = (): Occupancy => {
  return {
    cells: new Uint8Array(MAP_SIZE * MAP_SIZE * WORLD_HEIGHT),
    tops: new Uint8Array(MAP_SIZE * MAP_SIZE),
  };
};

export const cellIndex = (ix: number, y: number, iz: number): number => {
  return (ix * MAP_SIZE + iz) * WORLD_HEIGHT + y;
};

export const inGrid = (ix: number, y: number, iz: number): boolean => {
  return ix >= 0 && ix < MAP_SIZE && iz >= 0 && iz < MAP_SIZE && y >= 1 && y < WORLD_HEIGHT;
};

const raiseTop = (occupancy: Occupancy, ix: number, y: number, iz: number): void => {
  const column = ix * MAP_SIZE + iz;

  if (y > (occupancy.tops[column] ?? 0)) {
    occupancy.tops[column] = y;
  }
};

export const setCell = (
  occupancy: Occupancy,
  ix: number,
  y: number,
  iz: number,
  id: number,
): void => {
  if (inGrid(ix, y, iz)) {
    occupancy.cells[cellIndex(ix, y, iz)] = id;
    raiseTop(occupancy, ix, y, iz);
  }
};

export const setCellIfEmpty = (
  occupancy: Occupancy,
  ix: number,
  y: number,
  iz: number,
  id: number,
): void => {
  if (inGrid(ix, y, iz) && occupancy.cells[cellIndex(ix, y, iz)] === 0) {
    occupancy.cells[cellIndex(ix, y, iz)] = id;
    raiseTop(occupancy, ix, y, iz);
  }
};

export type MaterialEntry = Readonly<{ top: Rgb; side: Rgb }>;

export type MaterialTable = Readonly<{
  entries: MaterialEntry[];
  register: (top: Rgb, side: Rgb) => number;
}>;

export const createMaterialTable = (): MaterialTable => {
  const entries: MaterialEntry[] = [];
  const known = new Map<string, number>();

  const register = (top: Rgb, side: Rgb): number => {
    const key = `${top.join(',')}|${side.join(',')}`;
    const existing = known.get(key);

    if (existing !== undefined) {
      return existing;
    }

    if (entries.length >= MAX_MATERIALS) {
      throw new Error('material table full');
    }

    entries.push({ top, side });
    known.set(key, entries.length);

    return entries.length;
  };

  return { entries, register };
};
