import { CAMERA_FLOOR } from '@/scene/flight/flight.constants';

import type { Terrain } from '@/scene/flight/flight.types';

export const cameraFloor = (x: number, z: number, terrain: Terrain): number => {
  return Math.max(terrain.heightAt(x, z), terrain.seaLevel) + CAMERA_FLOOR;
};
