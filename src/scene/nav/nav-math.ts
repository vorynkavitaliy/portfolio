import { horizontalDistance } from '@/scene/flight/flight-math';

import type { FlightMode, Vec3 } from '@/scene/flight/flight.types';

export const LABEL_LIFT = 12;
export const LABEL_RANGE = 160;
export const NDC_X = 0.94;
export const NDC_Y = 0.92;
export const FRONT_Z = -0.5;
export const EDGE_PAD = { x: 80, y: 56 } as const;
export const EDGE_MIN_LENGTH = 1e-4;

export type EdgePlacement = { x: number; y: number; angle: number };

export const selectTarget = (
  mode: Readonly<FlightMode>,
  plane: Readonly<Vec3>,
  stations: readonly Readonly<Vec3>[],
  visited: number,
): number => {
  if (mode.kind === 'autopilot') {
    return mode.target;
  }

  let best = -1;
  let bestDistance = Infinity;

  for (let index = 0; index < stations.length; index += 1) {
    const station = stations[index];

    if (station === undefined || (visited & (1 << index)) !== 0) {
      continue;
    }

    const distance = horizontalDistance(station.x, station.z, plane.x, plane.z);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }

  return best;
};

export const isOnScreen = (viewZ: number, ndcX: number, ndcY: number): boolean => {
  return viewZ < FRONT_Z && Math.abs(ndcX) < NDC_X && Math.abs(ndcY) < NDC_Y;
};

export const labelVisible = (
  viewZ: number,
  ndcX: number,
  ndcY: number,
  distance: number,
  isTarget: boolean,
): boolean => {
  return isOnScreen(viewZ, ndcX, ndcY) && (distance < LABEL_RANGE || isTarget);
};

export const edgePlacement = (
  camX: number,
  camY: number,
  width: number,
  height: number,
  out: EdgePlacement = { x: 0, y: 0, angle: 0 },
): Readonly<EdgePlacement> => {
  let ex = camX;
  let ey = -camY;
  const length = Math.hypot(ex, ey);

  if (length >= EDGE_MIN_LENGTH) {
    ex /= length;
    ey /= length;
  } else {
    ex = 1;
    ey = 0;
  }

  const scaleX =
    Math.abs(ex) > EDGE_MIN_LENGTH ? (width / 2 - EDGE_PAD.x) / Math.abs(ex) : Infinity;

  const scaleY =
    Math.abs(ey) > EDGE_MIN_LENGTH ? (height / 2 - EDGE_PAD.y) / Math.abs(ey) : Infinity;

  const scale = Math.min(scaleX, scaleY);

  out.x = width / 2 + ex * scale;
  out.y = height / 2 + ey * scale;
  out.angle = Math.atan2(ex, -ey);

  return out;
};
