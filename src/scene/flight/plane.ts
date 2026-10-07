import { ORBIT_HEIGHT, ORBIT_RADIUS, ORBIT_SPEED } from '@/scene/flight/flight.constants';

import type { PlaneState, Vec3 } from '@/scene/flight/flight.types';

export const createPlane = (): PlaneState => {
  return { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0, speed: ORBIT_SPEED, turn: 0 };
};

export const placeOnOrbit = (plane: PlaneState, station: Readonly<Vec3>, theta: number): void => {
  plane.pos.x = station.x + Math.sin(theta) * ORBIT_RADIUS;
  plane.pos.y = station.y + ORBIT_HEIGHT;
  plane.pos.z = station.z + Math.cos(theta) * ORBIT_RADIUS;
  plane.yaw = Math.atan2(Math.cos(theta), -Math.sin(theta));
  plane.pitch = 0;
  plane.roll = 0;
  plane.turn = 0;
  plane.speed = ORBIT_SPEED;
};

export const isPlaneValid = (plane: Readonly<PlaneState>): boolean => {
  const { pos } = plane;

  return Number.isFinite(
    pos.x + pos.y + pos.z + plane.yaw + plane.pitch + plane.roll + plane.speed + plane.turn,
  );
};
